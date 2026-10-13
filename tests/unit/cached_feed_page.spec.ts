import { test } from "@japa/runner";
import type { SearchFreshness } from "#services/search_freshness/search_freshness";
import { cachedFeedPage, type SearchRefresh } from "#services/feeds/cached_feed_page";
import { containsPattern, type PageOf } from "#services/feeds/feed_query";

function cachedRows(rows: string[], events: string[] = []) {
  return {
    async paginate(page: number, perPage: number): Promise<PageOf<string>> {
      events.push("query");
      return {
        all: () => rows.slice((page - 1) * perPage, page * perPage),
        total: rows.length,
        perPage,
        currentPage: page,
        lastPage: Math.ceil(rows.length / perPage),
      };
    },
  };
}

const settled =
  (freshness: SearchFreshness, events: string[] = []): SearchRefresh =>
  async () => {
    events.push("refresh");
    return freshness;
  };
const failing: SearchRefresh = async () => {
  throw new Error("GitHub unavailable");
};

test.group("Cached feed page", () => {
  test("is ready when every search is fresh or refreshed", async ({ assert }) => {
    const result = await cachedFeedPage({
      refreshes: [settled({ status: "fresh" }), settled({ status: "refreshed", totalStored: 2 })],
      query: cachedRows(["a", "b"]),
      page: 1,
      perPage: 1,
    });
    assert.deepEqual(result, {
      items: ["a"],
      meta: { total: 2, perPage: 1, currentPage: 1, lastPage: 2 },
      refreshState: "ready",
    });
  });

  test("is refreshing when another request holds a search", async ({ assert }) => {
    const result = await cachedFeedPage({
      refreshes: [settled({ status: "fresh" }), settled({ status: "pending" })],
      query: cachedRows(["a"]),
      page: 1,
      perPage: 10,
    });
    assert.equal(result.refreshState, "refreshing");
  });

  test("is degraded when a search fails but cached rows remain", async ({ assert }) => {
    const result = await cachedFeedPage({
      refreshes: [settled({ status: "pending" }), failing],
      query: cachedRows(["a"]),
      page: 1,
      perPage: 10,
    });
    assert.equal(result.refreshState, "degraded");
    assert.deepEqual(result.items, ["a"]);
  });

  test("is unavailable when a search fails and nothing is cached", async ({ assert }) => {
    const result = await cachedFeedPage({
      refreshes: [failing],
      query: cachedRows([]),
      page: 1,
      perPage: 10,
    });
    assert.equal(result.refreshState, "unavailable");
    assert.deepEqual(result.meta, { total: 0, perPage: 10, currentPage: 1, lastPage: 1 });
  });

  test("refreshes before reading the first page and never on later pages", async ({ assert }) => {
    const first: string[] = [];
    await cachedFeedPage({
      refreshes: [settled({ status: "fresh" }, first)],
      query: cachedRows(["a"], first),
      page: 1,
      perPage: 10,
    });
    assert.deepEqual(first, ["refresh", "query"]);

    const later: string[] = [];
    const result = await cachedFeedPage({
      refreshes: [settled({ status: "pending" }, later), failing],
      query: cachedRows(["a", "b"], later),
      page: 2,
      perPage: 1,
    });
    assert.deepEqual(later, ["query"]);
    assert.equal(result.refreshState, "ready");
    assert.deepEqual(result.items, ["b"]);
  });
});

test("search patterns match LIKE wildcards literally", ({ assert }) => {
  assert.equal(containsPattern("50%_off\\"), "%50\\%\\_off\\\\%");
});
