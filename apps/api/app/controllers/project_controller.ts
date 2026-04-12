import type { HttpContext } from "@adonisjs/core/http";

import Project from "#models/project";
import UserProjectInteraction from "#models/user_project_interaction";
import GitHubService from "#services/git_hub_service";
import env from "#start/env";
import { interactionValidator } from "#validators/interaction_validator";

const SHOWCASE_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "c++",
  "php",
  "java",
  "kotlin",
  "swift",
  "dart",
  "ruby",
];

export default class ProjectController {
  private readonly FEED_FETCH_THRESHOLD = 25;
  private readonly FEED_LIMIT = 60;
  private readonly SHOWCASE_POOL = 30;
  private readonly SHOWCASE_PER_LANGUAGE = 6;
  private readonly SHOWCASE_MIN_THRESHOLD = 4;

  async showcase({ response }: HttpContext) {
    const serverToken = env.get("GITHUB_SERVER_TOKEN");

    const languagesData = await Promise.all(
      SHOWCASE_LANGUAGES.map(async (language) => {
        const pool = await Project.query()
          .where("language", language)
          .orderBy("stars", "desc")
          .limit(this.SHOWCASE_POOL)
          .preload("contributors", (query) => {
            query.orderBy("contributions", "desc").limit(2);
          });

        if (pool.length < this.SHOWCASE_MIN_THRESHOLD && serverToken) {
          GitHubService.fetchAndStore(language, "expert", serverToken, this.SHOWCASE_POOL).catch(
            () => {},
          );
        }

        const selected = this.pickRandom(pool, this.SHOWCASE_PER_LANGUAGE).map((p) => ({
          id: p.id,
          name: p.name,
          ownerName: p.ownerName,
          repositoryUrl: p.repositoryUrl,
          description: p.description,
          language: p.language,
          stars: p.stars,
          latestRelease: p.latestRelease,
          updatedAt: p.updatedAt,
          topics: p.topics?.slice(0, 2) ?? [],
          totalContributorsCount: p.totalContributorsCount,
          contributors: p.contributors.map((c) => ({
            login: c.login,
            avatarUrl: c.avatarUrl,
            profileUrl: c.profileUrl,
          })),
        }));

        return { language, projects: selected };
      }),
    );

    return response.ok({ languages: languagesData.filter((l) => l.projects.length > 0) });
  }

  async show({ auth, response, request }: HttpContext) {
    const payload = await request.validateUsing(interactionValidator);
    const user = auth.user!;

    const project = await Project.find(payload.params.id);
    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    if (GitHubService.needsDetailsFetch(project)) {
      await GitHubService.fetchProjectDetails(project, user.accessToken);
    }

    await project.load("contributors");

    return response.ok({ project });
  }

  async feed({ auth, response }: HttpContext) {
    const user = auth.user!;
    const preferences = user.preferences;

    if (!preferences) {
      return response.badRequest({ error: "User preferences not set" });
    }

    const { difficulty, languages } = preferences;

    const userProjectInteraction = await UserProjectInteraction.query()
      .where("userId", user.id)
      .select("projectId");
    const seenIds = userProjectInteraction.map((i) => Number(i.projectId));

    const countResult = await Project.query()
      .where("difficulty", difficulty)
      .whereIn("language", languages)
      .whereNotIn("id", seenIds.length > 0 ? seenIds : [-1])
      .count("* as total");

    const available = Number(countResult[0].$extras.total);

    if (available < this.FEED_FETCH_THRESHOLD) {
      await Promise.all(
        languages.map(async (language) => {
          if (await GitHubService.needsFetch(language, difficulty)) {
            await GitHubService.fetchAndStore(language, difficulty, user.accessToken);
          }
        }),
      );
    }

    const projectsPerLanguage = await Promise.all(
      languages.map((language) =>
        Project.query()
          .where("difficulty", difficulty)
          .where("language", language)
          .whereNotIn("id", seenIds.length > 0 ? seenIds : [-1])
          .orderBy("stars", "desc")
          .limit(this.FEED_LIMIT),
      ),
    );

    return response.ok({
      projects: this.roundRobin(projectsPerLanguage, this.FEED_LIMIT),
      available,
    });
  }

  async liked({ auth, response }: HttpContext) {
    const user = auth.user!;

    const interactions = await UserProjectInteraction.query()
      .where("userId", user.id)
      .where("type", "liked")
      .preload("project");

    return response.ok({ projects: interactions.map((i) => i.project) });
  }

  async like(ctx: HttpContext) {
    return this.recordInteraction(ctx, "liked");
  }

  async pass(ctx: HttpContext) {
    return this.recordInteraction(ctx, "passed");
  }

  private async recordInteraction(
    { auth, response, request }: HttpContext,
    type: "liked" | "passed",
  ) {
    const payload = await request.validateUsing(interactionValidator);
    const user = auth.user!;

    await UserProjectInteraction.updateOrCreate(
      { userId: user.id, projectId: payload.params.id },
      { type },
    );

    return response.ok({ message: type === "liked" ? "Liked" : "Passed" });
  }

  private pickRandom<T>(items: T[], count: number): T[] {
    return items
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, count)
      .map(({ item }) => item);
  }

  private roundRobin(groups: Project[][], limit: number): Project[] {
    const result: Project[] = [];
    const maxLength = Math.max(...groups.map((g) => g.length));

    for (let i = 0; i < maxLength; i++) {
      for (const group of groups) {
        if (group[i]) {
          result.push(group[i]);
          if (result.length === limit) {
            return result;
          }
        }
      }
    }

    return result;
  }
}
