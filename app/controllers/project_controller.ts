import type { HttpContext } from "@adonisjs/core/http";
import ProjectFeedService from "#services/project_feed_service";
import { projectIdValidator } from "#validators/project_id_validator";

export default class ProjectController {
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
