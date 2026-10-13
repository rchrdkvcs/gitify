import { test } from "@japa/runner";
import { DateTime } from "luxon";
import GithubFetchCache from "#models/github_fetch_cache";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

const token = "test-token";
const now = DateTime.fromISO("2026-10-12T12:00:00Z");

async function within<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), 1000);
    }),
  ]).finally(() => clearTimeout(timeout));
}

test("independent synchronization instances coordinate an initially missing criterion", async ({
  assert,
}) => {
  const language = `coordination-${Date.now()}`;
  let release!: () => void;
  let started!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const called = new Promise<void>((resolve) => {
    started = resolve;
  });
  class SlowAdapter extends FakeGitHubAdapter {
    async searchRepositories(...args: Parameters<FakeGitHubAdapter["searchRepositories"]>) {
      started();
      await wait;
      return super.searchRepositories(...args);
    }
  }
  const firstGithub = new SlowAdapter();
  const secondGithub = new FakeGitHubAdapter();
  const first = new GitHubSyncService(firstGithub, () => now);
  const second = new GitHubSyncService(secondGithub, () => now);
  const criteria = { language, difficulty: "expert" as const, token };
  const refreshing = first.ensureSearchFresh(criteria);
  try {
    await within(called, "remote search never started");
    assert.deepEqual(await second.ensureSearchFresh(criteria), { status: "pending" });
    assert.isEmpty(secondGithub.searchCalls);
    release();
    assert.deepEqual(await refreshing, { status: "refreshed", totalStored: 0 });
    assert.deepEqual(await second.ensureSearchFresh(criteria), { status: "fresh" });
    assert.lengthOf(firstGithub.searchCalls, 1);
    assert.isEmpty(secondGithub.searchCalls);
  } finally {
    release();
    await refreshing;
    await GithubFetchCache.query().where("language", language).delete();
  }
});

test("remote search permits leave fresh snapshots readable and defer excess refreshes", async ({
  assert,
}) => {
  const prefix = `search-budget-${Date.now()}`;
  let release!: () => void;
  let started!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  let active = 0;
  let peak = 0;
  class SlowAdapter extends FakeGitHubAdapter {
    async searchRepositories(...args: Parameters<FakeGitHubAdapter["searchRepositories"]>) {
      const repos = await super.searchRepositories(...args);
      active++;
      peak = Math.max(peak, active);
      if (active === 2) {
        started();
      }
      try {
        await wait;
        return repos;
      } finally {
        active--;
      }
    }
  }
  const github = new SlowAdapter();
  const first = new GitHubSyncService(github, () => now);
  const second = new GitHubSyncService(github, () => now);
  await GithubFetchCache.create({
    language: `${prefix}-fresh`,
    difficulty: "expert",
    fetchedAt: now,
    totalStored: 0,
  });
  const criteria = (language: string) => ({ language, difficulty: "expert" as const, token });
  const running = [
    first.ensureSearchFresh(criteria(`${prefix}-a`)),
    second.ensureSearchFresh(criteria(`${prefix}-b`)),
  ];
  try {
    await within(ready, "remote searches never started");
    const [fresh, deferred] = await within(
      Promise.all([
        second.ensureSearchFresh(criteria(`${prefix}-fresh`)),
        first.ensureSearchFresh(criteria(`${prefix}-c`)),
      ]),
      "cache request blocked behind remote search",
    );
    assert.deepEqual(fresh, { status: "fresh" });
    assert.deepEqual(deferred, { status: "pending" });
    assert.equal(peak, 2);
    assert.lengthOf(github.searchCalls, 2);
  } finally {
    release();
    await Promise.all(running);
    await GithubFetchCache.query().where("language", "like", `${prefix}%`).delete();
  }
});
