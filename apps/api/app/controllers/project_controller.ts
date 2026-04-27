import type { HttpContext } from "@adonisjs/core/http";
import Project from "#models/project";
import UserProjectInteraction from "#models/user_project_interaction";
import GitHubService from "#services/git_hub_service";
import env from "#start/env";
import { projectIdValidator } from "#validators/project_id_validator";

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
  private readonly FEED_PER_LANGUAGE_LIMIT = 60;
  private readonly FEED_TOTAL_LIMIT = 60;
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
            (err) => console.error(`Showcase prefetch failed for ${language}:`, err),
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
    const payload = await request.validateUsing(projectIdValidator);
    const user = auth.user!;

    const project = await Project.find(payload.params.id);
    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    if (GitHubService.needsDetailsFetch(project)) {
      await GitHubService.fetchProjectDetails(project, user.githubAccessToken).catch((err) =>
        console.error(`Failed to fetch details for project ${project.id}:`, err),
      );
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

    const userProjectInteractions = await UserProjectInteraction.query()
      .where("userId", user.id)
      .select("projectId");
    const seenIds = userProjectInteractions.map((i) => Number(i.projectId));
    const seenIdsOrFallback = seenIds.length > 0 ? seenIds : [-1];

    const available = await this.countAvailable(difficulty, languages, seenIdsOrFallback);

    if (available < this.FEED_FETCH_THRESHOLD) {
      await Promise.all(
        languages.map(async (language) => {
          if (await GitHubService.needsFetch(language, difficulty)) {
            await GitHubService.fetchAndStore(language, difficulty, user.githubAccessToken);
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
          .limit(this.FEED_PER_LANGUAGE_LIMIT),
      ),
    );

    return response.ok({
      projects: this.roundRobin(projectsPerLanguage, this.FEED_TOTAL_LIMIT),
      available: await this.countAvailable(difficulty, languages, seenIdsOrFallback),
    });
  }

  private async countAvailable(
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

  private readonly LIKED_PAGE_LIMIT = 20;

  async liked({ auth, request, response }: HttpContext) {
    const user = auth.user!;
    const page = Math.max(1, Number(request.qs().page ?? 1));

    const interactions = await UserProjectInteraction.query()
      .where("userId", user.id)
      .where("type", "liked")
      .orderBy("createdAt", "desc")
      .preload("project")
      .paginate(page, this.LIKED_PAGE_LIMIT);

    return response.ok({
      projects: interactions.all().map((i) => i.project),
      meta: interactions.getMeta(),
    });
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
    const payload = await request.validateUsing(projectIdValidator);
    const user = auth.user!;

    const project = await Project.find(payload.params.id);
    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    await UserProjectInteraction.updateOrCreate(
      { userId: user.id, projectId: project.id },
      { type },
    );

    return response.ok({ type });
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

    Array.from({ length: maxLength }).forEach((_, i) => {
      groups.forEach((group) => {
        if (group[i] && result.length < limit) {
          result.push(group[i]);
        }
      });
    });

    return result;
  }
}
