import type { UserPreferences, ShowcaseLanguageResult, ShowcaseProject } from "@gitify/types";
import Project from "#models/project";
import UserProjectInteraction from "#models/user_project_interaction";
import GitHubSyncService from "#services/github/github_sync_service";
import gitifyConfig from "#config/gitify";

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

        const projects: ShowcaseProject[] = pickRandom(
          pool,
          gitifyConfig.showcase.perLanguage,
        ).map((p) => ({
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
        }));

        return { language, projects };
      }),
    );

    return languagesData.filter((l) => l.projects.length > 0);
  }

  static async getProject(id: number, token: string): Promise<Project | null> {
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
    return project;
  }

  static async getFeed(
    userId: string,
    preferences: UserPreferences,
    token: string,
  ): Promise<{ projects: Project[]; available: number }> {
    const { difficulty, languages } = preferences;

    const interactions = await UserProjectInteraction.query()
      .where("userId", userId)
      .select("projectId");
    const seenIds = interactions.map((i) => Number(i.projectId));
    const seenIdsOrFallback = seenIds.length > 0 ? seenIds : [-1];

    const available = await countAvailable(difficulty, languages, seenIdsOrFallback);

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
      languages.map((language) =>
        Project.query()
          .where("difficulty", difficulty)
          .where("language", language)
          .whereNotIn("id", seenIdsOrFallback)
          .orderBy("stars", "desc")
          .limit(gitifyConfig.feed.perLanguageLimit),
      ),
    );

    return {
      projects: roundRobin(projectsPerLanguage, gitifyConfig.feed.totalLimit),
      available: await countAvailable(difficulty, languages, seenIdsOrFallback),
    };
  }

  static async getLikedProjects(userId: string, page: number) {
    return UserProjectInteraction.query()
      .where("userId", userId)
      .where("type", "liked")
      .orderBy("createdAt", "desc")
      .preload("project")
      .paginate(page, gitifyConfig.feed.likedPageLimit);
  }

  static async recordInteraction(
    userId: string,
    projectId: number,
    type: "liked" | "passed",
  ): Promise<Project | null> {
    const project = await Project.find(projectId);
    if (!project) {
      return null;
    }

    await UserProjectInteraction.updateOrCreate({ userId, projectId: project.id }, { type });
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

async function countAvailable(
  difficulty: string,
  languages: string[],
  seenIdsOrFallback: number[],
): Promise<number> {
  const result = await Project.query()
    .where("difficulty", difficulty)
    .whereIn("language", languages)
    .whereNotIn("id", seenIdsOrFallback)
    .count("* as total");
  return Number(result[0].$extras.total);
}
