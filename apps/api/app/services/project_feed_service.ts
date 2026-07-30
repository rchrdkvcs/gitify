import type { UserPreferences, ShowcaseLanguageResult, ShowcaseProject } from "@gitify/types";
import gitifyConfig from "#config/gitify";
import Project from "#models/project";
import UserProjectFavorite from "#models/user_project_favorite";
import GitHubSyncService from "#services/github/github_sync_service";

export default class ProjectFeedService {
  static async getShowcase(serverToken?: string): Promise<ShowcaseLanguageResult[]> {
    const languagesData = await Promise.all(
      gitifyConfig.showcase.languages.map(async (language) => {
        const pool = await Project.query()
          .where("language", language)
          .orderBy("stars", "desc")
          .limit(gitifyConfig.showcase.pool)
          .preload("contributors", (q) =>
            q.orderBy("contributions", "desc").limit(gitifyConfig.showcase.topContributorsDisplay),
          );

        if (pool.length < gitifyConfig.showcase.minThreshold && serverToken) {
          GitHubSyncService.fetchAndStore(
            language,
            gitifyConfig.showcase.seederDifficulty,
            serverToken,
            gitifyConfig.showcase.pool,
          ).catch((err) => console.error(`Showcase prefetch failed for ${language}:`, err));
        }

        const projects: ShowcaseProject[] = pickRandom(pool, gitifyConfig.showcase.perLanguage).map(
          (p) => ({
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
            contributors: p.contributors.map((c) => ({
              login: c.login,
              avatarUrl: c.avatarUrl,
              profileUrl: c.profileUrl,
            })),
          }),
        );

        return { language, projects };
      }),
    );

    return languagesData.filter((l) => l.projects.length > 0);
  }

  static async getProject(id: string, userId: string, token: string): Promise<Project | null> {
    const project = await Project.find(id);
    if (!project) {
      return null;
    }

    if (GitHubSyncService.needsDetailsFetch(project)) {
      await GitHubSyncService.fetchProjectDetails(project, token).catch((err) =>
        console.error(`Failed to fetch details for project ${project.id}:`, err),
      );
    }

    await project.load("contributors");
    project.isFavorite = await UserProjectFavorite.query()
      .where("userId", userId)
      .where("projectId", project.id)
      .first()
      .then(Boolean);
    return project;
  }

  static async getFeed(
    userId: string,
    preferences: UserPreferences,
    token: string,
  ): Promise<{ projects: Project[]; available: number }> {
    const { difficulty } = preferences;
    const languages = preferences.languages.map((l) => l.toLowerCase());

    const available = await countAvailable(difficulty, languages);

    if (available < gitifyConfig.feed.fetchThreshold) {
      await Promise.all(
        languages.map(async (language) => {
          if (await GitHubSyncService.needsFetch(language, difficulty)) {
            await GitHubSyncService.fetchAndStore(language, difficulty, token);
          }
        }),
      );
    }

    const projectsPerLanguage = await Promise.all(
      languages.map((language) => {
        const query = Project.query()
          .where("difficulty", difficulty)
          .where("language", language)
          .orderBy("stars", "desc")
          .limit(gitifyConfig.feed.perLanguageLimit);

        return query;
      }),
    );

    const projects = roundRobin(projectsPerLanguage, gitifyConfig.feed.totalLimit);
    await setFavoriteState(projects, userId);

    return {
      projects,
      available: await countAvailable(difficulty, languages),
    };
  }

  static async getFavoriteProjects(userId: string, page: number) {
    const favorites = await UserProjectFavorite.query()
      .where("userId", userId)
      .orderBy("createdAt", "desc")
      .preload("project")
      .paginate(page, gitifyConfig.feed.favoritePageLimit);

    favorites.all().forEach((favorite) => {
      favorite.project.isFavorite = true;
    });

    return favorites;
  }

  static async addFavorite(userId: string, projectId: string): Promise<Project | null> {
    const project = await Project.find(projectId);
    if (!project) {
      return null;
    }

    await UserProjectFavorite.firstOrCreate({ userId, projectId: project.id });
    return project;
  }

  static async removeFavorite(userId: string, projectId: string): Promise<Project | null> {
    const project = await Project.find(projectId);
    if (!project) {
      return null;
    }

    await UserProjectFavorite.query()
      .where("userId", userId)
      .where("projectId", project.id)
      .delete();
    return project;
  }
}

function pickRandom<T>(items: T[], count: number): T[] {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(({ item }) => item);
}

function roundRobin(groups: Project[][], limit: number): Project[] {
  const result: Project[] = [];
  const maxLength = Math.max(...groups.map((g) => g.length));

  Array.from({ length: maxLength }).forEach((_, i) => {
    groups.forEach((group) => {
      if (group[i] && result.length < limit) {
        result.push(group[i]);
      }
    });
  });

  return result;
}

async function setFavoriteState(projects: Project[], userId: string) {
  if (projects.length === 0) {
    return;
  }

  const favorites = await UserProjectFavorite.query()
    .where("userId", userId)
    .whereIn(
      "projectId",
      projects.map((project) => project.id),
    )
    .select("projectId");
  const favoriteIds = new Set(favorites.map((favorite) => favorite.projectId));

  projects.forEach((project) => {
    project.isFavorite = favoriteIds.has(project.id);
  });
}

async function countAvailable(difficulty: string, languages: string[]): Promise<number> {
  const query = Project.query().where("difficulty", difficulty).whereIn("language", languages);

  const result = await query.count("* as total");
  return Number(result[0]?.$extras.total ?? 0);
}
