import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { FakeGitHubAdapter, githubRepo } from "#tests/helpers/fake_github_adapter";

function adapter(repoId: number, readme: string): FakeGitHubAdapter {
  const github = new FakeGitHubAdapter();
  github.repos = [githubRepo({ id: repoId, name: `repo-${repoId}` })];
  github.details = { ...github.details, readme, languages: { TypeScript: 100 } };
  return github;
}

test.group("GitHub synchronization adapters", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("isolates imports and details across instances without patching production dependencies", async ({
    assert,
  }) => {
    const now = DateTime.fromISO("2026-10-12T12:00:00Z");
    const first = new GitHubSyncService(adapter(101, "# First"), () => now);
    const second = new GitHubSyncService(adapter(102, "# Second"), () => now);
    assert.equal(await first.fetchAndStore("typescript", "beginner", "first-token"), 1);
    assert.equal(await second.fetchAndStore("rust", "expert", "second-token"), 1);
    const firstProject = await Project.findByOrFail("githubRepoId", 101);
    const secondProject = await Project.findByOrFail("githubRepoId", 102);
    await first.fetchProjectDetails(firstProject, "first-token");
    await second.fetchProjectDetails(secondProject, "second-token");
    assert.equal(firstProject.readme, "# First");
    assert.equal(secondProject.readme, "# Second");
    assert.equal(firstProject.detailsFetchedAt?.toMillis(), now.toMillis());
    const cache = await GithubFetchCache.findByOrFail("language", "typescript");
    assert.equal(cache.fetchedAt?.toMillis(), now.toMillis());
  });

  test("evaluates freshness using its own injected clock", async ({ assert }) => {
    const now = DateTime.fromISO("2026-10-12T12:00:00Z");
    await GithubFetchCache.create({
      language: "typescript",
      difficulty: "beginner",
      totalStored: 0,
      fetchedAt: now,
    });
    const current = new GitHubSyncService(adapter(101, "# README"), () => now);
    const later = new GitHubSyncService(adapter(101, "# README"), () => now.plus({ days: 10 }));
    const criteria = { language: "typescript", difficulty: "beginner" as const, token: "token" };
    const currentSearch = await current.ensureSearchFresh(criteria);
    const laterSearch = await later.ensureSearchFresh(criteria);
    assert.equal(currentSearch.status, "fresh");
    assert.equal(laterSearch.status, "refreshed");
    const project = await Project.create({
      githubRepoId: 103,
      name: "repo",
      ownerName: "owner",
      repositoryUrl: "https://github.com/owner/repo",
      language: "typescript",
      difficulty: "beginner",
      detailsFetchedAt: now,
    });
    assert.isFalse(current.needsDetailsFetch(project));
    assert.isTrue(later.needsDetailsFetch(project));
  });
});
