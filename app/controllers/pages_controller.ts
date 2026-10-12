import type { HttpContext } from "@adonisjs/core/http";
import type User from "#models/user";
import type { PaginationMeta } from "#shared/types/index";
import IssueFeedService from "#services/issue_feed_service";
import ProjectFeedService from "#services/project_feed_service";
import { issueKindCatalog } from "#shared/issues";
import { languageCatalog } from "#shared/preferences";
import env from "#start/env";
import { parseExploreFilters } from "#validators/explore_filters";
import { parseIssueFilters } from "#validators/issue_filters";
import { projectSlugValidator } from "#validators/project_id_validator";

/** Guests browse with the server token; signed-in readers spend their own quota. */
function readerOf(user: User | undefined) {
  return {
    userId: user?.id ?? null,
    token: user?.githubAccessToken ?? env.get("GITHUB_SERVER_TOKEN") ?? null,
  };
}

/** Inertia infinite scroll metadata shared by the paginated feeds. */
function scrollPages(meta: PaginationMeta) {
  return {
    pageName: "page",
    currentPage: meta.currentPage,
    nextPage: meta.currentPage < meta.lastPage ? meta.currentPage + 1 : null,
    previousPage: meta.currentPage > 1 ? meta.currentPage - 1 : null,
  };
}

const languageOptions = () =>
  languageCatalog.map(({ id, name, icon }) => ({ value: id, label: name, icon }));

export default class PagesController {
  async home({ inertia }: HttpContext) {
    const languages = await ProjectFeedService.getShowcase(env.get("GITHUB_SERVER_TOKEN"));
    return inertia.render("index", { languages });
  }

  async explore({ auth, request, inertia }: HttpContext) {
    const preferences = auth.user?.preferences ?? null;
    const filters = parseExploreFilters(request.qs(), preferences);
    const [result, popularTopics] = await Promise.all([
      ProjectFeedService.explore(filters, request.input("page", 1), readerOf(auth.user)),
      ProjectFeedService.popularTopics(filters),
    ]);
    return inertia.render("explore", {
      projects: inertia.scroll(
        () => ({ data: result.projects, meta: result.meta }),
        (value) => scrollPages(value.meta),
      ),
      total: result.meta.total,
      filters,
      // The reader's interests come first among the topic shortcuts.
      topicOptions: [...new Set([...(preferences?.topics ?? []), ...popularTopics])],
      preferredTopics: preferences?.topics ?? [],
      languageOptions: languageOptions(),
      refreshState: result.refreshState,
    });
  }

  async issues({ auth, request, inertia }: HttpContext) {
    const filters = parseIssueFilters(request.qs(), auth.user?.preferences ?? null);
    const result = await IssueFeedService.explore(
      filters,
      request.input("page", 1),
      readerOf(auth.user),
    );
    return inertia.render("issues", {
      issues: inertia.scroll(
        () => ({ data: result.issues, meta: result.meta }),
        (value) => scrollPages(value.meta),
      ),
      total: result.meta.total,
      filters,
      languageOptions: languageOptions(),
      kindOptions: issueKindCatalog.map(({ id, label }) => ({ value: id, label })),
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
