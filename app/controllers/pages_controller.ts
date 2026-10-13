import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import type { PaginationMeta } from "#shared/types/index";
import ProjectNotFoundException from "#exceptions/project_not_found_exception";
import { parseExploreFilters } from "#feed_criteria/explore_criteria";
import { parseIssueFilters } from "#feed_criteria/issue_criteria";
import IssueFeed from "#services/feeds/issue_feed";
import { popularTopics } from "#services/feeds/popular_topics";
import ProjectCatalogue from "#services/feeds/project_catalogue";
import ProjectDetailReader from "#services/feeds/project_detail";
import { favoritePage } from "#services/feeds/project_favorites";
import ProjectShowcase from "#services/feeds/project_showcase";
import GitHubCredentials from "#services/github/github_credentials";
import { issueKindCatalog } from "#shared/issues";
import { languageCatalog } from "#shared/preferences";
import { projectSlugValidator } from "#validators/project_id_validator";

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

@inject()
export default class PagesController {
  constructor(
    private readonly credentials: GitHubCredentials,
    private readonly showcase: ProjectShowcase,
    private readonly catalogue: ProjectCatalogue,
    private readonly issueFeed: IssueFeed,
    private readonly projectDetail: ProjectDetailReader,
  ) {}

  async home({ inertia }: HttpContext) {
    const languages = await this.showcase.languages(this.credentials.server().token);
    return inertia.render("index", { languages });
  }

  async explore({ auth, request, inertia }: HttpContext) {
    const preferences = auth.user?.preferences ?? null;
    const filters = parseExploreFilters(request.qs(), preferences);
    const [result, topics] = await Promise.all([
      this.catalogue.explore(
        filters,
        request.input("page", 1),
        this.credentials.readerFor(auth.user),
      ),
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
    const result = await this.issueFeed.explore(
      filters,
      request.input("page", 1),
      this.credentials.readerFor(auth.user),
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
    const favorites = await favoritePage(auth.getUserOrFail().id, page);
    return inertia.render("favorites", {
      projects: favorites.projects,
      meta: favorites.meta,
    });
  }

  async project({ auth, request, inertia }: HttpContext) {
    const { params } = await request.validateUsing(projectSlugValidator);
    const page = await this.projectDetail.read(
      params.owner,
      params.name,
      this.credentials.readerFor(auth.user),
    );
    if (!page) {
      throw new ProjectNotFoundException();
    }
    const deferDetails = page.detailsPending || inertia.requestInfo().isPartialRequest;
    return inertia.render("projects/show", {
      project: page.project,
      detailsPending: page.detailsPending,
      ...(deferDetails ? { details: inertia.defer(page.details, { rescue: true }) } : {}),
    });
  }
}
