import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import User from "#models/user";
import { GitHubSyncService } from "#services/github/github_sync_service";
import ProjectFeedService from "#services/project_feed_service";
import { FakeGitHubAdapter, githubRepo } from "#tests/helpers/fake_github_adapter";
import { feedFor } from "#tests/helpers/feed";

const token = "test-token";

test.group("Project search memberships", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("one repository remains available at both levels and keeps its favorite after reimport", async ({
    assert,
  }) => {
    const user = await User.create({ email: "membership@example.com", name: "Member" });
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepo()];
    const sync = new GitHubSyncService(github);
    await sync.fetchAndStore("typescript", "beginner", token);
    const first = await feedFor(
      ProjectFeedService,
      user.id,
      { languages: ["typescript"], difficulty: "beginner" },
      token,
    );
    await ProjectFeedService.addFavorite(user.id, first.projects[0].id);
    await sync.fetchAndStore("typescript", "expert", token);
    for (const difficulty of ["beginner", "expert"] as const) {
      const feed = await feedFor(
        ProjectFeedService,
        user.id,
        { languages: ["typescript"], difficulty },
        token,
      );
      assert.equal(feed.available, 1);
      assert.equal(feed.projects[0]?.id, first.projects[0].id);
      assert.isTrue(feed.projects[0]?.isFavorite);
    }
    const favorites = await ProjectFeedService.getFavoriteProjects(user.id, 1);
    assert.equal(favorites.projects[0].difficulty, "beginner");
  });

  test("search language finds a repository regardless of its principal language and deduplicates the feed", async ({
    assert,
  }) => {
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepo({ language: "JavaScript" })];
    const sync = new GitHubSyncService(github);
    await sync.fetchAndStore("TypeScript", "expert", token);
    await sync.fetchAndStore("javascript", "expert", token);
    const feed = await feedFor(
      ProjectFeedService,
      "not-a-user",
      {
        languages: ["typescript", "javascript"],
        difficulty: "expert",
      },
      token,
    );
    assert.equal(feed.available, 1);
    assert.lengthOf(feed.projects, 1);
    assert.equal(feed.projects[0].language, "javascript");
    await sync.fetchAndStore("typescript", "beginner", token);
    const expertFeed = await feedFor(
      ProjectFeedService,
      "not-a-user",
      {
        languages: ["typescript"],
        difficulty: "expert",
      },
      token,
    );
    assert.equal(expertFeed.projects[0]?.id, feed.projects[0].id);
  });

  test("successful snapshots retire stale results including empty searches while favorites survive", async ({
    assert,
  }) => {
    const user = await User.create({ email: "snapshots@example.com", name: "Member" });
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepo()];
    const sync = new GitHubSyncService(github);
    const preferences = { languages: ["typescript"], difficulty: "beginner" as const };
    await sync.fetchAndStore("typescript", "beginner", token);
    const original = await feedFor(ProjectFeedService, user.id, preferences, token);
    await ProjectFeedService.addFavorite(user.id, original.projects[0].id);
    github.repos = [githubRepo({ id: 102, name: "replacement" })];
    await sync.fetchAndStore("typescript", "beginner", token);
    const replacement = await feedFor(ProjectFeedService, user.id, preferences, token);
    assert.equal(replacement.available, 1);
    assert.equal(replacement.projects[0].name, "replacement");
    github.repos = [];
    await sync.fetchAndStore("typescript", "beginner", token);
    const empty = await feedFor(ProjectFeedService, user.id, preferences, token);
    assert.equal(empty.available, 0);
    assert.isEmpty(empty.projects);
    const favorites = await ProjectFeedService.getFavoriteProjects(user.id, 1);
    assert.equal(favorites.projects[0]?.id, original.projects[0].id);
  });

  test("failed searches preserve the previous searchable snapshot", async ({ assert }) => {
    const github = new FakeGitHubAdapter();
    github.repos = [githubRepo()];
    const sync = new GitHubSyncService(github);
    await sync.fetchAndStore("typescript", "beginner", token);
    github.searchError = new Error("GitHub unavailable");
    await assert.rejects(
      () => sync.fetchAndStore("typescript", "beginner", token),
      "GitHub unavailable",
    );
    const feed = await feedFor(
      ProjectFeedService,
      "not-a-user",
      {
        languages: ["typescript"],
        difficulty: "beginner",
      },
      token,
    );
    assert.equal(feed.available, 1);
    assert.equal(feed.projects[0]?.name, "repo-101");
  });
});
