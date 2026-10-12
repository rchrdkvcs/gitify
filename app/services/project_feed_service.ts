import type {
  UserPreferences,
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
import { normalizePreferenceLanguages } from "#shared/preferences";
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
          repositoryUrl: p.repositoryUrl,
          description: p.description,
          language: p.language,
          stars: p.stars,
          latestRelease: p.latestRelease,
          updatedAt: p.updatedAt?.toISO() ?? null,
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

  async getProject(id: string, userId: string, token: string): Promise<ProjectDetail | null> {
    const project = await Project.find(id);
    if (!project) {
      return null;
    }

    if (this.sync.needsDetailsFetch(project)) {
      await this.sync
        .fetchProjectDetails(project, token)
        .catch((err) => console.error(`Failed to fetch details for project ${project.id}:`, err));
    }

    await project.load("contributors", (query) =>
      query.orderBy("contributions", "desc").orderBy("id", "asc"),
    );
    const isFavorite = await UserProjectFavorite.query()
      .where("userId", userId)
      .where("projectId", project.id)
      .first()
      .then(Boolean);
    const levels = await stableDifficulties([project]);
    return new ProjectDetailTransformer(project, {
      isFavorite,
      difficulty: levels.get(project.id)!,
    }).toObject();
  }

  async getFeed(
    userId: string,
    preferences: UserPreferences,
    token: string,
  ): Promise<{ projects: ProjectList[]; available: number; refreshState: FeedRefreshState }> {
    const { difficulty } = preferences;
    const languages = normalizePreferenceLanguages(preferences.languages);
    const refreshes = await Promise.allSettled(
      languages.map((language) =>
        this.sync.ensureSearchFresh({
          language,
          difficulty,
          token,
        }),
      ),
    );

    const projectsPerLanguage = await Promise.all(
      languages.map((language) => {
        const query = projectsForSearch([language], difficulty)
          .orderBy("stars", "desc")
          .limit(gitifyConfig.feed.perLanguageLimit);

        return query;
      }),
    );

    const projects = roundRobin(projectsPerLanguage, gitifyConfig.feed.totalLimit);
    const favoriteIds = await favoriteProjectIds(projects, userId);

    const failed = refreshes.some((refresh) => refresh.status === "rejected");
    const refreshing = refreshes.some(
      (refresh) => refresh.status === "fulfilled" && refresh.value.status === "pending",
    );
    const refreshState: FeedRefreshState = failed
      ? projects.length > 0
        ? "degraded"
        : "unavailable"
      : refreshing
        ? "refreshing"
        : "ready";

    return {
      projects: projects.map((project) =>
        new ProjectTransformer(project, {
          isFavorite: favoriteIds.has(project.id),
          difficulty,
        }).toObject(),
      ),
      available: await countAvailable(difficulty, languages),
      refreshState,
    };
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

function roundRobin(groups: Project[][], limit: number): Project[] {
  const result: Project[] = [];
  const seen = new Set<string>();
  const maxLength = Math.max(...groups.map((g) => g.length));

  Array.from({ length: maxLength }).forEach((_, i) => {
    groups.forEach((group) => {
      if (group[i] && !seen.has(group[i].id) && result.length < limit) {
        seen.add(group[i].id);
        result.push(group[i]);
      }
    });
  });

  return result;
}

async function favoriteProjectIds(projects: Project[], userId: string) {
  if (projects.length === 0) {
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

async function countAvailable(difficulty: string, languages: string[]): Promise<number> {
  const query = projectsForSearch(languages, difficulty);

  const result = await query.count("* as total");
  return Number(result[0]?.$extras.total ?? 0);
}

/** Select each repository once using the criteria under which it was discovered. */
export function projectsForSearch(languages: string[], difficulty?: string) {
  return Project.query().whereExists((membership) => {
    membership
      .from("project_search_memberships")
      .select("id")
      .whereColumn("project_search_memberships.project_id", "projects.id")
      .whereIn(
        "project_search_memberships.language",
        languages.map((language) => language.toLowerCase()),
      );
    if (difficulty) {
      membership.where("project_search_memberships.difficulty", difficulty);
    }
  });
}
