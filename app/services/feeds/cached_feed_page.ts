import type { SearchFreshness } from "#services/search_freshness/search_freshness";
import type { FeedRefreshState, PaginationMeta } from "#shared/types/index";
import { type PageOf, paginationMeta } from "#services/feeds/feed_query";

export type SearchRefresh = () => Promise<SearchFreshness>;

export type CachedFeedPageRequest<T> = {
  refreshes: SearchRefresh[];
  query: { paginate(page: number, perPage: number): Promise<PageOf<T>> };
  page: number;
  perPage: number;
};

export type CachedFeedPage<T> = {
  items: T[];
  meta: PaginationMeta;
  refreshState: FeedRefreshState;
};

export async function cachedFeedPage<T>(
  request: CachedFeedPageRequest<T>,
): Promise<CachedFeedPage<T>> {
  const outcomes =
    request.page === 1
      ? await Promise.allSettled(request.refreshes.map((refresh) => refresh()))
      : [];
  const page = await request.query.paginate(request.page, request.perPage);
  return {
    items: page.all(),
    meta: paginationMeta(page),
    refreshState: refreshStateOf(outcomes, page.total),
  };
}

function refreshStateOf(
  outcomes: PromiseSettledResult<SearchFreshness>[],
  cachedTotal: number,
): FeedRefreshState {
  if (outcomes.some((outcome) => outcome.status === "rejected")) {
    return cachedTotal > 0 ? "degraded" : "unavailable";
  }
  const pending = outcomes.some(
    (outcome) => outcome.status === "fulfilled" && outcome.value.status === "pending",
  );
  return pending ? "refreshing" : "ready";
}
