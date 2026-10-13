import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import gitifyConfig from "#config/gitify";
import Contributor from "#models/contributor";
import Project from "#models/project";
import GitHubSyncService from "#services/github/github_sync_service";
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

  test("a contributor write failure preserves the entire previous snapshot and retries after the cooldown", async ({
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
    assert.equal(
      stored.detailsRetryAfter!.toMillis(),
      now.plus({ seconds: gitifyConfig.cache.detailsRetrySeconds }).toMillis(),
    );
    assert.isFalse(sync.needsDetailsFetch(stored));
    now = now.plus({ seconds: gitifyConfig.cache.detailsRetrySeconds });
    assert.isTrue(sync.needsDetailsFetch(stored));
    github.snapshot.contributors[1].contributions = 25;
    await sync.fetchProjectDetails(project, "token");
    await project.load("contributors");
    assert.equal(project.readme, "# Replacement");
    assert.isNull(project.detailsRetryAfter);
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

  test("refresh keeps the identity of contributors that remain in the snapshot", async ({
    assert,
  }) => {
    const project = await createProject(96004);
    const github = new FakeGitHubAdapter();
    let now = DateTime.utc(2026, 1, 1);
    const sync = new GitHubSyncService(github, () => now);
    github.snapshot.contributors = [contributor(96041, 5), contributor(96042, 3)];
    await sync.fetchProjectDetails(project, "token");
    const [first] = await Contributor.query().where("githubUserId", 96041);
    now = now.plus({ days: 1 });
    github.snapshot.contributors = [
      { ...contributor(96041, 40), login: "renamed" },
      contributor(96043, 1),
    ];
    await sync.fetchProjectDetails(project, "token");
    const stored = await Contributor.query()
      .where("projectId", project.id)
      .orderBy("contributions", "desc");
    assert.deepEqual(
      stored.map((row) => [Number(row.githubUserId), row.login, row.contributions]),
      [
        [96041, "renamed", 40],
        [96043, "contributor-96043", 1],
      ],
    );
    assert.equal(stored[0].id, first.id);
    assert.equal(stored[0].createdAt!.toMillis(), first.createdAt!.toMillis());
    assert.equal(stored[0].updatedAt!.toMillis(), now.toMillis());
    assert.equal(stored[1].createdAt!.toMillis(), now.toMillis());
  });

  test("concurrent refreshes of the same project share one GitHub snapshot", async ({ assert }) => {
    const first = await createProject(96005);
    const second = await Project.findOrFail(first.id);
    const github = new FakeGitHubAdapter();
    github.snapshot.readme = "# Shared";
    const sync = new GitHubSyncService(github);
    await Promise.all([
      sync.fetchProjectDetails(first, "token"),
      new GitHubSyncService(github).fetchProjectDetails(second, "token"),
    ]);
    assert.lengthOf(github.snapshotCalls, 1);
    assert.equal(first.readme, "# Shared");
    assert.equal(second.readme, "# Shared");
    await sync.fetchProjectDetails(first, "token");
    assert.lengthOf(github.snapshotCalls, 2);
  });
});
