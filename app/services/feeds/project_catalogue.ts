import type Project from "#models/project";
import type GitHubSyncService from "#services/github/github_sync_service";
import type {
  Difficulty,
  ExploreFilters,
  FeedRefreshState,
  PaginationMeta,
  Project as ProjectList,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { cachedFeedPage, type SearchRefresh } from "#services/feeds/cached_feed_page";
import { containsPattern } from "#services/feeds/feed_query";
import { displayedDifficulties, favoriteProjectIds } from "#services/feeds/project_reader_state";
import { listedProjectCards } from "#services/feeds/visible_projects";
import { normalizePage } from "#shared/pagination";
import ProjectTransformer from "#transformers/project_transformer";

type CatalogueSync = Pick<GitHubSyncService, "revalidateSearch">;

export type CatalogueReader = { userId: string | null; token: string | null };

export type CataloguePage = {
  projects: ProjectList[];
  meta: PaginationMeta;
  refreshState: FeedRefreshState;
};

export default class ProjectCatalogue {
  constructor(private readonly sync: CatalogueSync) {}

  async explore(
    filters: ExploreFilters,
    requestedPage: unknown,
    reader: CatalogueReader,
  ): Promise<CataloguePage> {
    const { items, meta, refreshState } = await cachedFeedPage({
      refreshes: this.refreshes(filters, reader.token),
      query: this.query(filters),
      page: normalizePage(requestedPage),
      perPage: gitifyConfig.feed.pageSize,
    });
    const favoriteIds = await favoriteProjectIds(items, reader.userId);
    const difficulties = await this.difficulties(items, filters.level);
    return {
      projects: items.map((project) =>
        new ProjectTransformer(project, {
          isFavorite: favoriteIds.has(project.id),
          difficulty: difficulties.get(project.id)!,
        }).toObject(),
      ),
      meta,
      refreshState,
    };
  }

  private refreshes(filters: ExploreFilters, token: string | null): SearchRefresh[] {
    if (!token) {
      return [];
    }
    const levels: Difficulty[] = filters.level === "all" ? ["beginner", "expert"] : [filters.level];
    return filters.languages.flatMap((language) =>
      levels.map((difficulty) => () => this.sync.revalidateSearch({ language, difficulty, token })),
    );
  }

  private query(filters: ExploreFilters) {
    const query = listedProjectCards(filters);
    if (filters.topic) {
      query.whereRaw("jsonb_exists(topics, ?)", [filters.topic]);
    }
    const search = filters.q.trim();
    if (search) {
      const pattern = containsPattern(search);
      query.where((builder) => {
        builder
          .whereILike("name", pattern)
          .orWhereILike("owner_name", pattern)
          .orWhereILike("description", pattern)
          .orWhereRaw("topics::text ILIKE ?", [pattern]);
      });
    }
    if (filters.minScore !== null) {
      query.where("newcomer_score", ">=", filters.minScore);
    }
    if (filters.sort === "recent") {
      query.orderByRaw("pushed_at DESC NULLS LAST");
    } else if (filters.sort === "welcome") {
      query.orderByRaw("newcomer_score DESC NULLS LAST").orderBy("stars", "desc");
    } else if (filters.sort === "issues") {
      query.orderBy("open_issues_count", "desc");
    } else {
      query.orderBy("stars", "desc");
    }
    return query.orderBy("id", "asc");
  }

  private async difficulties(
    projects: Project[],
    level: ExploreFilters["level"],
  ): Promise<Map<string, Difficulty>> {
    if (level === "all") {
      return displayedDifficulties(projects);
    }
    return new Map(projects.map((project) => [project.id, level]));
  }
}
