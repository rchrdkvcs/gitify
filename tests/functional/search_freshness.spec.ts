import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import gitifyConfig from "#config/gitify";
import GithubFetchCache from "#models/github_fetch_cache";
import { GitHubRateLimitError, GitHubUnavailableError } from "#services/github/github_errors";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { ProjectFeedService } from "#services/project_feed_service";
import { FakeGitHubAdapter, githubRepository } from "#tests/helpers/fake_github_adapter";
import { feedFor } from "#tests/helpers/feed";

const token = "test-token";
const now = DateTime.fromISO("2026-10-12T12:00:00Z");

test.group("Search freshness", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("a recent empty search stays fresh until its TTL expires", async ({ assert }) => {
    const github = new FakeGitHubAdapter();
    let clock = now;
    const sync = new GitHubSyncService(github, () => clock);
    const criteria = { language: "typescript", difficulty: "expert" as const, token };
    assert.deepEqual(await sync.ensureSearchFresh(criteria), {
      status: "refreshed",
      totalStored: 0,
    });
    clock = now.plus({ hours: 23 });
    assert.deepEqual(await sync.ensureSearchFresh(criteria), { status: "fresh" });
    clock = now.plus({ hours: 24 });
    assert.deepEqual(await sync.ensureSearchFresh(criteria), {
      status: "refreshed",
      totalStored: 0,
    });
    assert.lengthOf(github.searchCalls, 2);
  });
  test("abundant expired stock and a missing language both refresh after normalizing legacy choices", async ({
    assert,
  }) => {
    const github = new FakeGitHubAdapter();
    github.repos = Array.from({ length: 30 }, (_, index) => githubRepository({ id: 8000 + index }));
    let clock = now;
    const sync = new GitHubSyncService(github, () => clock);
    await sync.fetchAndStore("typescript", "expert", token);
    clock = now.plus({ hours: 24 });
    github.repos = [githubRepository({ id: 8100, name: "new-snapshot" })];
    const feed = await feedFor(
      new ProjectFeedService(sync),
      "no-user",
      {
        difficulty: "expert",
        languages: [" TypeScript ", "typescript", "RUST", "invalid"],
      },
      token,
    );
    assert.deepEqual(
      github.searchCalls.map((call) => call.language),
      ["typescript", "typescript", "rust"],
    );
    assert.equal(feed.available, 1);
    assert.equal(feed.projects[0].name, "new-snapshot");
  });

  test("showcase refresh preserves canonical search coverage for the expert feed", async ({
    assert,
  }) => {
    class PagedAdapter extends FakeGitHubAdapter {
      async searchRepositories(...args: Parameters<FakeGitHubAdapter["searchRepositories"]>) {
        const repos = await super.searchRepositories(...args);
        return repos.slice(0, args[3]);
      }
    }
    const github = new PagedAdapter();
    github.repos = Array.from({ length: 100 }, (_, index) =>
      githubRepository({ id: 9000 + index, name: `coverage-${index}` }),
    );
    const sync = new GitHubSyncService(github, () => now);
    for (const language of gitifyConfig.showcase.languages.filter(
      (candidate) => candidate !== "typescript",
    )) {
      await GithubFetchCache.create({
        language,
        difficulty: "expert",
        totalStored: 0,
        fetchedAt: now,
      });
    }
    const feed = new ProjectFeedService(sync);
    await feed.getShowcase(token);
    const result = await feedFor(
      feed,
      "no-user",
      { languages: ["typescript"], difficulty: "expert" },
      token,
    );
    assert.equal(result.available, 100);
    assert.lengthOf(result.projects, gitifyConfig.feed.pageSize);
    assert.deepEqual(
      github.searchCalls.map((call) => call.perPage),
      [100],
    );
  });

  test("failed refreshes preserve cached coverage and share an expiring retry cooldown", async ({
    assert,
  }) => {
    let clock = now;
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepository({ id: 9500, name: "previous-search" })];
    const sync = new GitHubSyncService(github, () => clock);
    const feed = new ProjectFeedService(sync);
    const preferences = { languages: ["typescript"], difficulty: "expert" as const };
    await sync.ensureSearchFresh({ language: "typescript", difficulty: "expert", token });
    github.searchCalls = [];
    clock = now.plus({ hours: 24 });
    github.searchError = new GitHubRateLimitError(403, null);
    for (let index = 0; index < 2; index++) {
      const result = await feedFor(feed, "no-user", preferences, token);
      assert.equal(result.refreshState, "degraded");
      assert.equal(result.projects[0].name, "previous-search");
    }
    const otherGithub = new FakeGitHubAdapter();
    const other = new GitHubSyncService(otherGithub, () => clock);
    await assert.rejects(
      () => other.ensureSearchFresh({ language: "typescript", difficulty: "expert", token }),
      /retry deferred/,
    );
    assert.isEmpty(otherGithub.searchCalls);
    assert.lengthOf(github.searchCalls, 1);
    const cache = await GithubFetchCache.findByOrFail("language", "typescript");
    assert.equal(cache.fetchedAt?.toMillis(), now.toMillis());
    assert.equal(cache.totalStored, 1);
    clock = clock.plus({ seconds: 60 });
    github.searchError = undefined;
    github.repos = [githubRepository({ id: 9501, name: "recovered-search" })];
    const recovered = await feedFor(feed, "no-user", preferences, token);
    assert.equal(recovered.refreshState, "ready");
    assert.equal(recovered.projects[0].name, "recovered-search");
    await cache.refresh();
    assert.isNull(cache.retryAfter);
    assert.equal(cache.fetchedAt?.toMillis(), clock.toMillis());
  });

  test("never-successful searches stay unavailable during their shared cooldown", async ({
    assert,
  }) => {
    let clock = now;
    const github = new FakeGitHubAdapter();
    github.searchError = new GitHubRateLimitError(403, null);
    const first = new ProjectFeedService(new GitHubSyncService(github, () => clock));
    const preferences = { languages: ["rust"], difficulty: "expert" as const };
    const firstResult = await feedFor(first, "no-user", preferences, token);
    assert.equal(firstResult.refreshState, "unavailable");
    const otherGithub = new FakeGitHubAdapter();
    const second = new ProjectFeedService(new GitHubSyncService(otherGithub, () => clock));
    const deferred = await feedFor(second, "no-user", preferences, token);
    assert.equal(deferred.refreshState, "unavailable");
    assert.lengthOf(github.searchCalls, 1);
    assert.isEmpty(otherGithub.searchCalls);
    const cache = await GithubFetchCache.findByOrFail("language", "rust");
    assert.isNull(cache.fetchedAt);
    clock = clock.plus({ seconds: 60 });
    const retried = await feedFor(second, "no-user", preferences, token);
    assert.equal(retried.refreshState, "ready");
    assert.lengthOf(otherGithub.searchCalls, 1);
  });

  test("a small recent showcase does not repeatedly import and missing details are bounded", async ({
    assert,
  }) => {
    const github = new FakeGitHubAdapter();
    github.repos = [8200, 8201, 8202].map((id) => githubRepository({ id, name: `repo-${id}` }));
    const sync = new GitHubSyncService(github, () => now);
    for (const language of gitifyConfig.showcase.languages) {
      await sync.fetchAndStore(language, "expert", token);
    }
    github.searchCalls = [];
    const feed = new ProjectFeedService(sync);
    const first = await feed.getShowcase(token);
    assert.lengthOf(github.snapshotCalls, 2);
    const second = await feed.getShowcase(token);
    assert.lengthOf(github.searchCalls, 0);
    assert.lengthOf(first[0].projects, 3);
    assert.lengthOf(second[0].projects, 3);
    assert.lengthOf(github.snapshotCalls, 3);
    assert.lengthOf(new Set(github.snapshotCalls.map((call) => call.repoName)), 3);
  });

  test("showcase keeps its cached presentation when remote search and details are unavailable", async ({
    assert,
  }) => {
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepository({ id: 8300, name: "cached-showcase" })];
    let clock = now;
    const sync = new GitHubSyncService(github, () => clock);
    await sync.fetchAndStore("typescript", "expert", token);
    clock = now.plus({ hours: 24 });
    github.searchError = new GitHubUnavailableError(null, "search unavailable");
    github.snapshotError = new GitHubUnavailableError(503);
    const showcase = await new ProjectFeedService(sync).getShowcase(token);
    assert.equal(
      showcase.find((entry) => entry.language === "typescript")?.projects[0].name,
      "cached-showcase",
    );
  });
});
