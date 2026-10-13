import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import User from "#models/user";
import ProjectCatalogue from "#services/feeds/project_catalogue";
import { GitHubUnavailableError } from "#services/github/github_errors";
import GitHubSyncService from "#services/github/github_sync_service";
import { backgroundRefreshes } from "#services/search_freshness/background_refreshes";
import { FakeGitHubAdapter, githubRepository } from "#tests/helpers/fake_github_adapter";
import { feedFor } from "#tests/helpers/feed";

const now = DateTime.fromISO("2026-10-12T12:00:00Z");
const token = "private-feed-test-token";

test.group("Degraded project feed", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("returns cached projects when their remote refresh fails", async ({ assert }) => {
    const user = await User.create({ email: "feed@example.com", name: "Feed reader" });
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepository()];
    let clock = now;
    const sync = new GitHubSyncService(github, () => clock);
    const feed = new ProjectCatalogue(sync);
    const preferences = { difficulty: "beginner" as const, languages: ["typescript"] };
    await sync.ensureSearchFresh({ ...preferences, language: "typescript", token });
    clock = now.plus({ days: 2 });
    github.searchError = new GitHubUnavailableError(null, `Remote outage: ${token}`);

    const refreshing = await feedFor(feed, user.id, preferences, token);
    assert.equal(refreshing.refreshState, "refreshing");
    assert.deepEqual(
      refreshing.projects.map((project) => project.name),
      ["repo-101"],
    );
    await backgroundRefreshes.settled();
    const result = await feedFor(feed, user.id, preferences, token);

    assert.deepEqual(
      result.projects.map((project) => project.name),
      ["repo-101"],
    );
    assert.equal(result.available, 1);
    assert.equal(result.refreshState, "degraded");
    assert.notInclude(JSON.stringify(result), token);
    assert.notInclude(JSON.stringify(result), "Remote outage");
  });

  test("keeps cached and successfully refreshed languages when one search fails", async ({
    assert,
  }) => {
    const user = await User.create({ email: "mixed-feed@example.com", name: "Feed reader" });
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepository()];
    let clock = now;
    const sync = new GitHubSyncService(github, () => clock);
    await sync.ensureSearchFresh({ language: "typescript", difficulty: "beginner", token });
    clock = now.plus({ days: 2 });
    github.repos = [githubRepository({ id: 102, name: "rust-project", language: "Rust" })];
    const failTypescript = new GitHubUnavailableError(null, "TypeScript unavailable");
    class MixedGitHub extends FakeGitHubAdapter {
      override async searchRepositories(
        ...args: Parameters<FakeGitHubAdapter["searchRepositories"]>
      ) {
        if (args[0] === "typescript") {
          throw failTypescript;
        }
        return super.searchRepositories(...args);
      }
    }
    const mixed = new MixedGitHub();
    mixed.repos = github.repos;
    const feed = new ProjectCatalogue(new GitHubSyncService(mixed, () => clock));
    const criteria = { difficulty: "beginner" as const, languages: ["typescript", "rust"] };

    await feedFor(feed, user.id, criteria, token);
    await backgroundRefreshes.settled();
    const result = await feedFor(feed, user.id, criteria, token);

    assert.deepEqual(
      result.projects.map((project) => project.name),
      ["repo-101", "rust-project"],
    );
    assert.equal(result.available, 2);
    assert.equal(result.refreshState, "degraded");
  });

  test("distinguishes an unavailable empty feed from a successful empty search", async ({
    assert,
  }) => {
    const user = await User.create({ email: "empty-feed@example.com", name: "Feed reader" });
    const github = new FakeGitHubAdapter();
    github.searchError = new GitHubUnavailableError(null, "GitHub unavailable");
    let clock = now;
    const feed = new ProjectCatalogue(new GitHubSyncService(github, () => clock));
    const preferences = { difficulty: "beginner" as const, languages: ["typescript"] };

    const preparing = await feedFor(feed, user.id, preferences, token);
    assert.deepEqual(preparing.projects, []);
    assert.equal(preparing.refreshState, "refreshing");
    await backgroundRefreshes.settled();
    const unavailable = await feedFor(feed, user.id, preferences, token);
    assert.deepEqual(unavailable.projects, []);
    assert.equal(unavailable.available, 0);
    assert.equal(unavailable.refreshState, "unavailable");

    github.searchError = undefined;
    clock = clock.plus({ seconds: 60 });
    await feedFor(feed, user.id, preferences, token);
    await backgroundRefreshes.settled();
    const empty = await feedFor(feed, user.id, preferences, token);
    assert.deepEqual(empty.projects, []);
    assert.equal(empty.available, 0);
    assert.equal(empty.refreshState, "ready");
  });
});

test("feed reports an ongoing refresh without calling GitHub again", async ({ assert }) => {
  const lock = await db.transaction();
  try {
    await lock.rawQuery("SELECT pg_advisory_xact_lock(hashtext(?))", [
      "project-search:rust:beginner",
    ]);
    const github = new FakeGitHubAdapter();
    const feed = new ProjectCatalogue(new GitHubSyncService(github, () => now));
    const result = await feedFor(
      feed,
      null as unknown as string,
      {
        difficulty: "beginner",
        languages: ["rust"],
      },
      token,
    );
    assert.equal(result.refreshState, "refreshing");
    assert.isEmpty(github.searchCalls);
  } finally {
    await lock.rollback();
  }
});
