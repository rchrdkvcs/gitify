import { test } from "@japa/runner";
import GithubFetchCache from "#models/github_fetch_cache";
import { GitHubRateLimitError, GitHubUnavailableError } from "#services/github/github_errors";
import {
  SearchFreshnessPolicy,
  SearchRetryDeferredError,
} from "#services/search_freshness/search_freshness";
import { SearchPermits } from "#services/search_freshness/search_permits";
import {
  freshnessHarness,
  freshnessNow as now,
  gate,
  within,
} from "#tests/helpers/search_freshness";

test.group("Search snapshot freshness", () => {
  test("imports a missing snapshot, serves it while fresh and re-imports after its TTL", async ({
    assert,
  }) => {
    const { clock, remote, refresh } = freshnessHarness();
    assert.deepEqual(await refresh(), { status: "refreshed", totalStored: 1 });
    clock.now = now.plus({ hours: 5, minutes: 59 });
    assert.deepEqual(await refresh(), { status: "fresh" });
    clock.now = now.plus({ hours: 6 });
    remote.stored = 3;
    assert.deepEqual(await refresh(), { status: "refreshed", totalStored: 3 });
    assert.equal(remote.imports, 2);
  });

  test("force re-imports a fresh snapshot", async ({ assert }) => {
    const { remote, refresh } = freshnessHarness();
    await refresh();
    assert.deepEqual(await refresh({ force: true }), { status: "refreshed", totalStored: 1 });
    assert.equal(remote.imports, 2);
  });

  test("a failure defers every retry, forced ones included, for 60 seconds", async ({ assert }) => {
    const { clock, remote, refresh } = freshnessHarness();
    remote.failure = new GitHubUnavailableError(503);
    await assert.rejects(() => refresh(), GitHubUnavailableError);
    remote.failure = undefined;
    clock.now = now.plus({ seconds: 59 });
    await assert.rejects(() => refresh(), SearchRetryDeferredError);
    await assert.rejects(() => refresh({ force: true }), SearchRetryDeferredError);
    assert.equal(remote.imports, 1);
    clock.now = now.plus({ seconds: 60 });
    assert.deepEqual(await refresh(), { status: "refreshed", totalStored: 1 });
  });

  test("a rate-limited failure defers retries until GitHub's reset time", async ({ assert }) => {
    const { clock, remote, refresh } = freshnessHarness();
    const resetAt = now.plus({ minutes: 15 });
    remote.failure = new GitHubRateLimitError(403, resetAt.toJSDate());
    await assert.rejects(() => refresh(), GitHubRateLimitError);
    remote.failure = undefined;
    clock.now = now.plus({ minutes: 14 });
    await assert.rejects(() => refresh(), SearchRetryDeferredError);
    clock.now = resetAt;
    assert.deepEqual(await refresh(), { status: "refreshed", totalStored: 1 });
    assert.equal(remote.imports, 2);
  });

  test("a rate limit without a future reset time falls back to 60 seconds", async ({ assert }) => {
    for (const resetAt of [null, now.minus({ minutes: 1 }).toJSDate()]) {
      const { clock, remote, refresh } = freshnessHarness();
      remote.failure = new GitHubRateLimitError(429, resetAt);
      await assert.rejects(() => refresh(), GitHubRateLimitError);
      remote.failure = undefined;
      await assert.rejects(() => refresh(), SearchRetryDeferredError);
      clock.now = now.plus({ seconds: 60 });
      assert.include(await refresh(), { status: "refreshed" });
    }
  });

  test("a failed import rolls back and keeps the previous snapshot", async ({ assert }) => {
    const { clock, store, key, remote, refresh } = freshnessHarness();
    await refresh();
    clock.now = now.plus({ hours: 7 });
    await assert.rejects(
      () =>
        refresh({
          importSnapshot: async (trx) => {
            await GithubFetchCache.create(
              { language: key, difficulty: "expert", totalStored: 9, fetchedAt: clock.now },
              { client: trx },
            );
            throw new GitHubUnavailableError(null, "outage");
          },
        }),
      "outage",
    );
    assert.isNull(await GithubFetchCache.findBy("language", key));
    assert.equal(store.snapshot?.fetchedAt?.toMillis(), now.toMillis());
    assert.equal(store.snapshot?.totalStored, 1);
    assert.equal(remote.imports, 1);
  });

  test("exhausted permits keep fresh snapshots readable and defer other refreshes", async ({
    assert,
  }) => {
    const permits = new SearchPermits(2);
    const remote = gate();
    let active = 0;
    let peak = 0;
    const slowImport = async () => {
      active++;
      peak = Math.max(peak, active);
      if (active === 2) {
        remote.reached();
      }
      await remote.opened;
      active--;
      return 0;
    };
    const first = freshnessHarness(permits);
    const second = freshnessHarness(permits);
    const fresh = freshnessHarness(permits);
    const deferred = freshnessHarness(permits);
    await fresh.store.save({ fetchedAt: now, totalStored: 1, retryAfter: null });
    const running = [
      first.refresh({ importSnapshot: slowImport }),
      second.refresh({ importSnapshot: slowImport }),
    ];
    try {
      await within(remote.arrived, "remote imports never started");
      const outcomes = await within(
        Promise.all([fresh.refresh(), deferred.refresh()]),
        "a fresh read blocked behind remote imports",
      );
      assert.deepEqual(outcomes, [{ status: "fresh" }, { status: "pending" }]);
      assert.equal(deferred.remote.imports, 0);
      assert.equal(peak, 2);
    } finally {
      remote.open();
      await Promise.all(running);
    }
    assert.include(await deferred.refresh(), { status: "refreshed" });
  });

  test("permits are returned after a failed import", async ({ assert }) => {
    const permits = new SearchPermits(1);
    const failing = freshnessHarness(permits);
    failing.remote.failure = new GitHubUnavailableError(503);
    await assert.rejects(() => failing.refresh(), GitHubUnavailableError);
    assert.include(await freshnessHarness(permits).refresh(), { status: "refreshed" });
  });

  test("independent processes refreshing one criterion import it once", async ({ assert }) => {
    const { clock, store, key, remote, refresh } = freshnessHarness();
    const remoteCall = gate();
    const otherProcess = new SearchFreshnessPolicy(() => clock.now, new SearchPermits(2));
    let otherImports = 0;
    const otherRefresh = () =>
      otherProcess.ensureFresh({
        key,
        ttlHours: 6,
        store,
        importSnapshot: async () => ++otherImports,
      });
    const refreshing = refresh({
      importSnapshot: async () => {
        remote.imports++;
        await remoteCall.pass();
        return 4;
      },
    });
    try {
      await within(remoteCall.arrived, "remote import never started");
      assert.deepEqual(await otherRefresh(), { status: "pending" });
      remoteCall.open();
      assert.deepEqual(await refreshing, { status: "refreshed", totalStored: 4 });
      assert.deepEqual(await otherRefresh(), { status: "fresh" });
    } finally {
      remoteCall.open();
      await refreshing.catch(() => undefined);
    }
    assert.equal(remote.imports, 1);
    assert.equal(otherImports, 0);
  });
});
