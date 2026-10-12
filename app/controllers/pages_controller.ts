import type { HttpContext } from "@adonisjs/core/http";
import type User from "#models/user";
import ProjectFeedService from "#services/project_feed_service";
import { languageCatalog } from "#shared/preferences";
import env from "#start/env";
import { parseExploreFilters } from "#validators/explore_filters";
import { projectSlugValidator } from "#validators/project_id_validator";

/** Guests browse with the server token; signed-in readers spend their own quota. */
function readerOf(user: User | undefined) {
  return {
    userId: user?.id ?? null,
    token: user?.githubAccessToken ?? env.get("GITHUB_SERVER_TOKEN") ?? null,
  };
}

export default class PagesController {
  async home({ inertia }: HttpContext) {
    const languages = await ProjectFeedService.getShowcase(env.get("GITHUB_SERVER_TOKEN"));
    return inertia.render("index", { languages });
  }

  async explore({ auth, request, inertia }: HttpContext) {
    const filters = parseExploreFilters(request.qs(), auth.user?.preferences ?? null);
    const [result, topicOptions] = await Promise.all([
      ProjectFeedService.explore(filters, request.input("page", 1), readerOf(auth.user)),
      ProjectFeedService.popularTopics(filters),
    ]);
    return inertia.render("explore", {
      projects: inertia.scroll(
        () => ({ data: result.projects, meta: result.meta }),
        (value) => ({
          pageName: "page",
          currentPage: value.meta.currentPage,
          nextPage:
            value.meta.currentPage < value.meta.lastPage ? value.meta.currentPage + 1 : null,
          previousPage: value.meta.currentPage > 1 ? value.meta.currentPage - 1 : null,
        }),
      ),
      total: result.meta.total,
      filters,
      topicOptions,
      languageOptions: languageCatalog.map(({ id, name, icon }) => ({
        value: id,
        label: name,
        icon,
      })),
      refreshState: result.refreshState,
    });
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
    const { params } = await request.validateUsing(projectSlugValidator);
    const project = await ProjectFeedService.getProject(
      params.owner,
      params.name,
      readerOf(auth.user),
    );
    if (!project) {
      return response.notFound("Projet introuvable");
    }
    return inertia.render("projects/show", { project });
  }
}
