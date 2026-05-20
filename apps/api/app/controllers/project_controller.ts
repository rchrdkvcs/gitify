import type { HttpContext } from "@adonisjs/core/http";
import ProjectFeedService from "#services/project_feed_service";
import env from "#start/env";
import { projectIdValidator } from "#validators/project_id_validator";

export default class ProjectController {
  async showcase({ response }: HttpContext) {
    const serverToken = env.get("GITHUB_SERVER_TOKEN") ?? undefined;
    const languages = await ProjectFeedService.getShowcase(serverToken);
    return response.ok({ languages });
  }

  async show({ auth, response, request }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const user = auth.getUserOrFail();
    const project = await ProjectFeedService.getProject(params.id, user.githubAccessToken!);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    return response.ok({ project });
  }

  async feed({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail();

    if (!user.preferences) {
      return response.badRequest({ error: "User preferences not set" });
    }

    const result = await ProjectFeedService.getFeed(
      user.id,
      user.preferences,
      user.githubAccessToken!,
    );

    return response.ok(result);
  }

  async liked({ auth, request, response }: HttpContext) {
    const page = Math.max(1, Number(request.qs().page ?? 1));
    const interactions = await ProjectFeedService.getLikedProjects(auth.user!.id, page);

    return response.ok({
      projects: interactions.all().map((i) => i.project),
      meta: interactions.getMeta(),
    });
  }

  async like({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.recordInteraction(auth.user!.id, params.id, "liked");

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ type: "liked" });
  }

  async pass({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.recordInteraction(auth.user!.id, params.id, "passed");

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ type: "passed" });
  }
}
