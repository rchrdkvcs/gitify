import db from "@adonisjs/lucid/services/db";
import type {
  ExploreFilters,
  ShowcaseLanguageResult,
  ShowcaseProject,
  FeedRefreshState,
  Project as ProjectList,
  ProjectDetail,
  Difficulty,
  PaginationMeta,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import UserProjectFavorite from "#models/user_project_favorite";
import githubSync, { type GitHubSyncService } from "#services/github/github_sync_service";
import { normalizePage } from "#shared/pagination";
import ProjectDetailTransformer from "#transformers/project_detail_transformer";
import ProjectTransformer from "#transformers/project_transformer";

export class ProjectFeedService {
  constructor(private readonly sync: GitHubSyncService = githubSync) {}
  async getShowcase(serverToken?: string): Promise<ShowcaseLanguageResult[]> {
    const detailsReserved = new Set<string>();
    const languagesData = await Promise.all(
      gitifyConfig.showcase.languages.map(async (language) => {
        if (serverToken) {
          await this.sync
            .ensureSearchFresh({
              language,
              difficulty: gitifyConfig.showcase.seederDifficulty,
              token: serverToken,
            })
            .catch((error) =>
              console.error(`Showcase search refresh failed for ${language}:`, error),
            );
        }
        const pool = await projectsForSearch([language])
          .orderBy("stars", "desc")
          .limit(gitifyConfig.showcase.pool)
          .preload("contributors", (q) => q.orderBy("contributions", "desc").orderBy("id", "asc"));

        const selected = pickRandom(pool, gitifyConfig.showcase.perLanguage);
        if (serverToken) {
          for (const project of selected) {
            if (detailsReserved.size >= gitifyConfig.showcase.detailsRefreshLimit) {
              break;
            }
            if (detailsReserved.has(project.id) || !this.sync.needsDetailsFetch(project)) {
              continue;
            }
            // Bound remote detail work for the whole home request, including shared repositories.
            detailsReserved.add(project.id);
            await this.sync
              .fetchProjectDetails(project, serverToken)
              .catch((error) =>
                console.error(`Showcase details refresh failed for ${project.id}:`, error),
              );
            await project.load("contributors", (query) =>
              query.orderBy("contributions", "desc").orderBy("id", "asc"),
            );
          }
        }
        const projects: ShowcaseProject[] = selected.map((p) => ({
          id: p.id,
          name: p.name,
          ownerName: p.ownerName,
          ownerAvatarUrl: p.avatarUrl,
          repositoryUrl: p.repositoryUrl,
          description: p.description,
          language: p.language,
          stars: p.stars,
          latestRelease: p.latestRelease,
          pushedAt: p.pushedAt?.toISO() ?? null,
          topics: p.topics?.slice(0, gitifyConfig.showcase.topicsDisplay) ?? [],
          totalContributorsCount: p.totalContributorsCount,
          contributors: p.contributors
            .slice(0, gitifyConfig.showcase.topContributorsDisplay)
            .map((c) => ({
              login: c.login,
              avatarUrl: c.avatarUrl,
              profileUrl: c.profileUrl,
            })),
        }));

        return { language, projects };
      }),
    );

    return languagesData.filter((l) => l.projects.length > 0);
  }

  async getProject(
    ownerName: string,
    name: string,
    reader: { userId: string | null; token: string | null },
  ): Promise<ProjectDetail | null> {
    const project = await Project.query()
      .whereRaw("lower(owner_name) = ?", [ownerName.toLowerCase()])
      .whereRaw("lower(name) = ?", [name.toLowerCase()])
      .orderBy("stars", "desc")
      .first();
    if (!project) {
      return null;
    }

    if (reader.token && this.sync.needsDetailsFetch(project)) {
      await this.sync
        .fetchProjectDetails(project, reader.token)
        .catch((err) => console.error(`Failed to fetch details for project ${project.id}:`, err));
    }

    await project.load("contributors", (query) =>
      query.orderBy("contributions", "desc").orderBy("id", "asc"),
    );
    const favoriteIds = await favoriteProjectIds([project], reader.userId);
    const levels = await stableDifficulties([project]);
    return new ProjectDetailTransformer(project, {
      isFavorite: favoriteIds.has(project.id),
      difficulty: levels.get(project.id)!,
    }).toObject();
  }

  /** Public catalogue. Only the first page may refresh GitHub searches for the selected criteria. */
  async explore(
    filters: ExploreFilters,
    requestedPage: unknown,
    reader: { userId: string | null; token: string | null },
  ): Promise<{ projects: ProjectList[]; meta: PaginationMeta; refreshState: FeedRefreshState }> {
    const page = normalizePage(requestedPage);
    const levels: Difficulty[] = filters.level === "all" ? ["beginner", "expert"] : [filters.level];

    const refreshes =
      page === 1 && reader.token
        ? await Promise.allSettled(
            filters.languages.flatMap((language) =>
              levels.map((difficulty) =>
                this.sync.ensureSearchFresh({ language, difficulty, token: reader.token! }),
              ),
            ),
          )
        : [];

    const query = projectsForSearch(
      filters.languages,
      filters.level === "all" ? undefined : filters.level,
    );
    if (filters.topic) {
      query.whereRaw("jsonb_exists(topics, ?)", [filters.topic]);
    }
    const search = filters.q.trim();
    if (search) {
      const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      query.where((builder) => {
        builder
          .whereILike("name", pattern)
          .orWhereILike("owner_name", pattern)
          .orWhereILike("description", pattern)
          .orWhereRaw("topics::text ILIKE ?", [pattern]);
      });
    }
    if (filters.sort === "recent") {
      query.orderByRaw("pushed_at DESC NULLS LAST");
    } else if (filters.sort === "issues") {
      query.orderBy("open_issues_count", "desc");
    } else {
      query.orderBy("stars", "desc");
    }
    const paginator = await query.orderBy("id", "asc").paginate(page, gitifyConfig.feed.pageSize);
    const projects = paginator.all();

    const favoriteIds = await favoriteProjectIds(projects, reader.userId);
    const difficulties =
      filters.level === "all"
        ? await stableDifficulties(projects)
        : new Map(projects.map((project) => [project.id, filters.level as Difficulty]));

    const failed = refreshes.some((refresh) => refresh.status === "rejected");
    const refreshing = refreshes.some(
      (refresh) => refresh.status === "fulfilled" && refresh.value.status === "pending",
    );
    const refreshState: FeedRefreshState = failed
      ? paginator.total > 0
        ? "degraded"
        : "unavailable"
      : refreshing
        ? "refreshing"
        : "ready";

    return {
      projects: projects.map((project) =>
        new ProjectTransformer(project, {
          isFavorite: favoriteIds.has(project.id),
          difficulty: difficulties.get(project.id)!,
        }).toObject(),
      ),
      meta: {
        total: paginator.total,
        perPage: paginator.perPage,
        currentPage: paginator.currentPage,
        lastPage: Math.max(1, paginator.lastPage),
      },
      refreshState,
    };
  }

  /** Most frequent topics among the repositories matching the language and level filters. */
  async popularTopics(filters: ExploreFilters, limit = 14): Promise<string[]> {
    const scope = projectsForSearch(
      filters.languages,
      filters.level === "all" ? undefined : filters.level,
    ).select("id");
    const rows = await db
      .from("projects")
      .joinRaw(
        "CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(projects.topics) = 'array' THEN projects.topics ELSE '[]'::jsonb END) AS topic",
      )
      .whereIn("projects.id", scope)
      .select(db.raw("topic, count(*) AS total"))
      .groupBy("topic")
      .orderBy("total", "desc")
      .orderBy("topic", "asc")
      .limit(limit);
    return rows.map((row: { topic: string }) => row.topic);
  }

  async getFavoriteProjects(
    userId: string,
    requestedPage: unknown,
  ): Promise<{ projects: ProjectList[]; meta: PaginationMeta }> {
    const total = await UserProjectFavorite.query().where("userId", userId).count("* as total");
    const lastPage = Math.max(
      1,
      Math.ceil(Number(total[0]?.$extras.total ?? 0) / gitifyConfig.feed.favoritePageLimit),
    );
    const page = Math.min(normalizePage(requestedPage), lastPage);
    const query = () =>
      UserProjectFavorite.query()
        .where("userId", userId)
        .orderBy("createdAt", "desc")
        .orderBy("id", "desc")
        .preload("project");
    let favorites = await query().paginate(page, gitifyConfig.feed.favoritePageLimit);

    // A removal between the count and page query can retire the requested last page.
    if (page > Math.max(1, favorites.lastPage)) {
      favorites = await query().paginate(
        Math.max(1, favorites.lastPage),
        gitifyConfig.feed.favoritePageLimit,
      );
    }
    const projects = favorites.all().map((favorite) => favorite.project);
    const levels = await stableDifficulties(projects);
    return {
      projects: projects.map((project) =>
        new ProjectTransformer(project, {
          isFavorite: true,
          difficulty: levels.get(project.id)!,
        }).toObject(),
      ),
      meta: {
        total: favorites.total,
        perPage: favorites.perPage,
        currentPage: favorites.currentPage,
        lastPage: Math.max(1, favorites.lastPage),
      },
    };
  }

  async addFavorite(userId: string, projectId: string): Promise<boolean> {
    const project = await Project.find(projectId);
    if (!project) {
      return false;
    }

    await UserProjectFavorite.firstOrCreate({ userId, projectId: project.id });
    return true;
  }

  async removeFavorite(userId: string, projectId: string): Promise<boolean> {
    const project = await Project.find(projectId);
    if (!project) {
      return false;
    }

    await UserProjectFavorite.query()
      .where("userId", userId)
      .where("projectId", project.id)
      .delete();
    return true;
  }
}

export default new ProjectFeedService();

function pickRandom<T>(items: T[], count: number): T[] {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(({ item }) => item);
}

async function favoriteProjectIds(projects: Project[], userId: string | null) {
  if (!userId || projects.length === 0) {
    return new Set<string>();
  }

  const favorites = await UserProjectFavorite.query()
    .where("userId", userId)
    .whereIn(
      "projectId",
      projects.map((project) => project.id),
    )
    .select("projectId");
  return new Set(favorites.map((favorite) => favorite.projectId));
}

/** Outside a selected feed, display beginner when eligible, otherwise expert.
 * Repositories retired from every search retain their legacy level as fallback.
 * This is a display rule: membership in both levels remains unchanged.
 */
async function stableDifficulties(projects: Project[]): Promise<Map<string, Difficulty>> {
  const levels = new Map(projects.map((project) => [project.id, project.difficulty]));
  if (!projects.length) {
    return levels;
  }
  const memberships = await ProjectSearchMembership.query()
    .whereIn(
      "projectId",
      projects.map((project) => project.id),
    )
    .select("projectId", "difficulty");
  const current = new Map<string, Difficulty>();
  for (const membership of memberships) {
    if (current.get(membership.projectId) !== "beginner") {
      current.set(membership.projectId, membership.difficulty);
    }
  }
  for (const [id, difficulty] of current) {
    levels.set(id, difficulty);
  }
  return levels;
}

/** Select each repository once using the criteria under which it was discovered.
 * No language means every language; retired repositories (without membership) stay hidden.
 */
export function projectsForSearch(languages: string[], difficulty?: string) {
  return Project.query().whereExists((membership) => {
    membership
      .from("project_search_memberships")
      .select("id")
      .whereColumn("project_search_memberships.project_id", "projects.id");
    if (languages.length) {
      membership.whereIn(
        "project_search_memberships.language",
        languages.map((language) => language.toLowerCase()),
      );
    }
    if (difficulty) {
      membership.where("project_search_memberships.difficulty", difficulty);
    }
  });
}
