import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import Project from "#models/project";
import { GitHubSyncService } from "#services/github/github_sync_service";
import {
  FakeGitHubAdapter,
  githubContributor as contributor,
  repositorySnapshot,
} from "#tests/helpers/fake_github_adapter";

async function createProject(githubRepoId: number) {
  return Project.create({
    githubRepoId,
    ownerName: "owner",
    name: `transaction-${githubRepoId}`,
    repositoryUrl: `https://github.com/owner/transaction-${githubRepoId}`,
    language: "typescript",
    difficulty: "beginner",
  });
}

test.group("GitHub detail snapshot transactions", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("refresh replaces the contributor snapshot and updates the caller's project", async ({
    assert,
  }) => {
    const project = await createProject(96001);
    const github = new FakeGitHubAdapter();
    let now = DateTime.utc(2026, 1, 1);
    const sync = new GitHubSyncService(github, () => now);
    github.snapshot = repositorySnapshot({
      readme: "# First",
      languages: { TypeScript: 100 },
      latestRelease: "v1",
      totalContributorsCount: 20,
      contributors: [contributor(96011), contributor(96012)],
    });
    await sync.fetchProjectDetails(project, "token");
    await project.load("contributors");
    now = now.plus({ days: 10 });
    github.snapshot = repositorySnapshot({
      readme: "# Second",
      languages: { JavaScript: 200 },
      latestRelease: "v2",
      totalContributorsCount: 30,
      contributors: [contributor(96012, 50), contributor(96013)],
    });
    await sync.fetchProjectDetails(project, "token");
    assert.equal(project.readme, "# Second");
    assert.equal(project.detailsFetchedAt!.toMillis(), now.toMillis());
    await project.load("contributors");
    assert.sameMembers(
      project.contributors.map((c) => Number(c.githubUserId)),
      [96012, 96013],
    );
    assert.equal(
      project.contributors.find((c) => Number(c.githubUserId) === 96012)!.contributions,
      50,
    );
    const stored = await Project.findOrFail(project.id);
    await stored.load("contributors");
    assert.equal(stored.readme, "# Second");
    assert.deepEqual(stored.languages, { JavaScript: 200 });
    assert.equal(stored.latestRelease, "v2");
    assert.equal(stored.totalContributorsCount, 30);
    assert.sameMembers(
      stored.contributors.map((c) => Number(c.githubUserId)),
      [96012, 96013],
    );
    assert.isFalse(sync.needsDetailsFetch(stored));
  });

  test("a contributor write failure preserves the entire previous snapshot and allows retry", async ({
    assert,
  }) => {
    const project = await createProject(96002);
    const github = new FakeGitHubAdapter();
    let now = DateTime.utc(2026, 1, 1);
    const sync = new GitHubSyncService(github, () => now);
    github.snapshot = repositorySnapshot({
      readme: "# Cached",
      languages: { TypeScript: 100 },
      latestRelease: "v1",
      totalContributorsCount: 20,
      contributors: [contributor(96021), contributor(96022)],
    });
    await sync.fetchProjectDetails(project, "token");
    await project.load("contributors");
    const previousFetchedAt = now;
    now = now.plus({ days: 10 });
    github.snapshot = repositorySnapshot({
      readme: "# Replacement",
      languages: { JavaScript: 200 },
      latestRelease: "v2",
      totalContributorsCount: 30,
      contributors: [contributor(96022, 50), contributor(96023, 2147483648)],
    });
    await assert.rejects(() => sync.fetchProjectDetails(project, "token"), /out of range/);
    assert.equal(project.readme, "# Cached");
    assert.equal(project.detailsFetchedAt!.toMillis(), previousFetchedAt.toMillis());
    assert.sameMembers(
      project.contributors.map((c) => Number(c.githubUserId)),
      [96021, 96022],
    );
    const stored = await Project.findOrFail(project.id);
    await stored.load("contributors");
    assert.equal(stored.readme, "# Cached");
    assert.deepEqual(stored.languages, { TypeScript: 100 });
    assert.equal(stored.latestRelease, "v1");
    assert.equal(stored.totalContributorsCount, 20);
    assert.equal(stored.detailsFetchedAt!.toMillis(), previousFetchedAt.toMillis());
    assert.sameMembers(
      stored.contributors.map((c) => Number(c.githubUserId)),
      [96021, 96022],
    );
    assert.equal(
      stored.contributors.find((c) => Number(c.githubUserId) === 96022)!.contributions,
      10,
    );
    assert.isTrue(sync.needsDetailsFetch(stored));
    github.snapshot.contributors[1].contributions = 25;
    await sync.fetchProjectDetails(project, "token");
    await project.load("contributors");
    assert.equal(project.readme, "# Replacement");
    assert.sameMembers(
      project.contributors.map((c) => Number(c.githubUserId)),
      [96022, 96023],
    );
    assert.isFalse(sync.needsDetailsFetch(project));
  });

  test("a successful empty contributor result clears the previous snapshot", async ({ assert }) => {
    const project = await createProject(96003);
    const github = new FakeGitHubAdapter();
    const sync = new GitHubSyncService(github);
    github.snapshot.contributors = [contributor(96031)];
    github.snapshot.totalContributorsCount = 1;
    await sync.fetchProjectDetails(project, "token");
    github.snapshot.contributors = [];
    github.snapshot.totalContributorsCount = 0;
    await sync.fetchProjectDetails(project, "token");
    await project.load("contributors");
    assert.isEmpty(project.contributors);
    assert.equal(project.totalContributorsCount, 0);
    assert.isFalse(sync.needsDetailsFetch(project));
  });
});
