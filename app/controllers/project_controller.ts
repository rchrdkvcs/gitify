import type { HttpContext } from "@adonisjs/core/http";
import ProjectNotFoundException from "#exceptions/project_not_found_exception";
import { addFavorite, removeFavorite } from "#services/feeds/project_favorites";
import { projectIdValidator } from "#validators/project_id_validator";

export default class ProjectController {
  async addFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const found = await addFavorite(auth.getUserOrFail().id, params.id);
    if (!found) {
      throw new ProjectNotFoundException();
    }
    return response.ok({ isFavorite: true });
  }

  async removeFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const found = await removeFavorite(auth.getUserOrFail().id, params.id);
    if (!found) {
      throw new ProjectNotFoundException();
    }
    return response.ok({ isFavorite: false });
  }
}
