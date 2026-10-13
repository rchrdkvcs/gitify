import { test } from "@japa/runner";
import { effectScope, nextTick } from "vue";
import type { IssueFilters } from "#shared/types/index";
import type { FilterQuery } from "../../inertia/lib/feed-filters.js";
import {
  useFilteredFeed,
  type FilteredFeedTimer,
} from "../../inertia/composables/useFilteredFeed.js";
import { issueFilterSchema } from "../../inertia/lib/feed-filter-schemas.js";

function fakeTimer() {
  let nextHandle = 0;
  const pending = new Map<number, { callback: () => void; delay: number }>();
  const timer: FilteredFeedTimer = {
    setTimeout(callback, delay) {
      pending.set(++nextHandle, { callback, delay });
      return nextHandle;
    },
    clearTimeout(handle) {
      pending.delete(handle as number);
    },
  };
  function flush() {
    const callbacks = [...pending.values()];
    pending.clear();
    for (const entry of callbacks) {
      entry.callback();
    }
  }
  return { timer, pending, flush };
}

function harness(source: Partial<IssueFilters> = {}) {
  const visits: FilterQuery[] = [];
  const clock = fakeTimer();
  const scope = effectScope();
  const feed = scope.run(() =>
    useFilteredFeed({
      schema: issueFilterSchema,
      source: { q: "", languages: [], kind: "all", unassigned: true, sort: "recent", ...source },
      visit: (query) => visits.push(query),
      debounced: ["q"],
      timer: clock.timer,
    }),
  )!;
  return { feed, visits, clock, scope };
}

test.group("useFilteredFeed", () => {
  test("search edits are debounced into a single reload", async ({ assert }) => {
    const { feed, visits, clock, scope } = harness();
    feed.filters.q = "v";
    await nextTick();
    feed.filters.q = "vue";
    await nextTick();
    assert.lengthOf(visits, 0);
    assert.equal(clock.pending.size, 1);
    assert.equal([...clock.pending.values()][0].delay, 300);
    clock.flush();
    assert.deepEqual(visits, [
      { q: "vue", language: undefined, label: "all", unassigned: undefined, sort: undefined },
    ]);
    scope.stop();
  });

  test("other filters reload immediately and absorb a pending search", async ({ assert }) => {
    const { feed, visits, clock, scope } = harness();
    feed.filters.q = "vue";
    feed.filters.languages = ["typescript"];
    await nextTick();
    assert.lengthOf(visits, 1);
    assert.equal(visits[0].q, "vue");
    assert.equal(visits[0].language, "typescript");
    assert.equal(clock.pending.size, 0);
    scope.stop();
  });

  test("changes that keep the same query do not reload", async ({ assert }) => {
    const { feed, visits, clock, scope } = harness({ languages: ["go"] });
    feed.filters.languages = ["go"];
    feed.filters.q = "  ";
    await nextTick();
    assert.lengthOf(visits, 0);
    assert.equal(clock.pending.size, 0);
    scope.stop();
  });

  test("reset restores defaults with one reload and clears active filters", async ({ assert }) => {
    const { feed, visits, clock, scope } = harness({
      q: "bug",
      languages: ["go"],
      unassigned: false,
      sort: "stars",
    });
    assert.isTrue(feed.hasActiveFilters.value);
    feed.resetFilters();
    await nextTick();
    assert.isFalse(feed.hasActiveFilters.value);
    clock.flush();
    assert.deepEqual(visits, [
      { q: undefined, language: undefined, label: "all", unassigned: undefined, sort: undefined },
    ]);
    scope.stop();
  });

  test("reload sends the current query on demand", ({ assert }) => {
    const { feed, visits, scope } = harness({ kind: "documentation" });
    feed.reload();
    assert.equal(visits[0].label, "documentation");
    scope.stop();
  });

  test("disposing the scope drops a pending search reload", async ({ assert }) => {
    const { feed, visits, clock, scope } = harness();
    feed.filters.q = "vue";
    await nextTick();
    scope.stop();
    assert.equal(clock.pending.size, 0);
    assert.lengthOf(visits, 0);
  });
});
