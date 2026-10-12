import type { HttpContext } from "@adonisjs/core/http";
import ProjectFeedService from "#services/project_feed_service";
import { projectIdValidator } from "#validators/project_id_validator";

export default class ProjectController {
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

  async favorites({ auth, request, response }: HttpContext) {
    const page = Math.max(1, Number(request.qs().page ?? 1));
    const favorites = await ProjectFeedService.getFavoriteProjects(auth.user!.id, page);

    return response.ok({
      projects: favorites.all().map((favorite) => favorite.project),
      meta: favorites.getMeta(),
    });
  }

  async addFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.addFavorite(auth.user!.id, params.id);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ isFavorite: true });
  }

  async removeFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.removeFavorite(auth.user!.id, params.id);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ isFavorite: false });
  }
}
