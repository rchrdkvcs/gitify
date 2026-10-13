import type { HttpContext } from "@adonisjs/core/http";
import type User from "#models/user";
import type { PaginationMeta } from "#shared/types/index";
import ProjectNotFoundException from "#exceptions/project_not_found_exception";
import { parseExploreFilters } from "#feed_criteria/explore_criteria";
import { parseIssueFilters } from "#feed_criteria/issue_criteria";
import issueFeed from "#services/feeds/issue_feed";
import { popularTopics } from "#services/feeds/popular_topics";
import projectCatalogue from "#services/feeds/project_catalogue";
import projectDetailReader from "#services/feeds/project_detail";
import { favoritePage } from "#services/feeds/project_favorites";
import projectShowcase from "#services/feeds/project_showcase";
import { issueKindCatalog } from "#shared/issues";
import { languageCatalog } from "#shared/preferences";
import env from "#start/env";
import { projectSlugValidator } from "#validators/project_id_validator";

function readerOf(user: User | undefined) {
  return {
    userId: user?.id ?? null,
    token: user?.githubAccessToken ?? env.get("GITHUB_SERVER_TOKEN") ?? null,
  };
}

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
    const languages = await projectShowcase.languages(env.get("GITHUB_SERVER_TOKEN"));
    return inertia.render("index", { languages });
  }

  async explore({ auth, request, inertia }: HttpContext) {
    const preferences = auth.user?.preferences ?? null;
    const filters = parseExploreFilters(request.qs(), preferences);
    const [result, topics] = await Promise.all([
      projectCatalogue.explore(filters, request.input("page", 1), readerOf(auth.user)),
      popularTopics(filters),
    ]);
    return inertia.render("explore", {
      projects: inertia.scroll(
        () => ({ data: result.projects, meta: result.meta }),
        (value) => scrollPages(value.meta),
      ),
      total: result.meta.total,
      filters,
      topicOptions: [...new Set([...(preferences?.topics ?? []), ...topics])],
      preferredTopics: preferences?.topics ?? [],
      languageOptions: languageOptions(),
      refreshState: result.refreshState,
    });
  }

  async issues({ auth, request, inertia }: HttpContext) {
    const filters = parseIssueFilters(request.qs(), auth.user?.preferences ?? null);
    const result = await issueFeed.explore(filters, request.input("page", 1), readerOf(auth.user));
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
    const favorites = await favoritePage(auth.getUserOrFail().id, page);
    return inertia.render("favorites", {
      projects: favorites.projects,
      meta: favorites.meta,
    });
  }

  async project({ auth, request, inertia }: HttpContext) {
    const { params } = await request.validateUsing(projectSlugValidator);
    const project = await projectDetailReader.read(params.owner, params.name, readerOf(auth.user));
    if (!project) {
      throw new ProjectNotFoundException();
    }
    return inertia.render("projects/show", { project });
  }
}
