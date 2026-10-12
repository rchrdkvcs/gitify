import type { HttpContext } from "@adonisjs/core/http";
import ProjectFeedService from "#services/project_feed_service";
import env from "#start/env";
import { projectIdValidator } from "#validators/project_id_validator";

export default class PagesController {
  async home({ inertia }: HttpContext) {
    const languages = await ProjectFeedService.getShowcase(env.get("GITHUB_SERVER_TOKEN"));
    return inertia.render("index", { languages });
  }

  async explore({ auth, inertia, response }: HttpContext) {
    const user = auth.getUserOrFail();
    if (!user.preferences) {
      return response.redirect("/preferences");
    }
    const { projects, refreshState } = await ProjectFeedService.getFeed(
      user.id,
      user.preferences,
      user.githubAccessToken!,
    );
    return inertia.render("explore", { projects, refreshState });
  }

  async favorites({ auth, request, inertia }: HttpContext) {
    const page = request.input("page", 1);
    const favorites = await ProjectFeedService.getFavoriteProjects(auth.getUserOrFail().id, page);
    return inertia.render("favorites", {
      projects: favorites.projects,
      meta: favorites.meta,
    });
  }

  async project({ auth, request, inertia, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const user = auth.getUserOrFail();
    const project = await ProjectFeedService.getProject(
      params.id,
      user.id,
      user.githubAccessToken!,
    );
    if (!project) {
      return response.notFound("Projet introuvable");
    }
    return inertia.render("projects/show", { project: project });
  }
}
