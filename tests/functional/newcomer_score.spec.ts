import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import type { ContributorActivity, RepositoryInsights } from "#shared/types/index";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

const now = DateTime.utc(2026, 10, 12);

const activity: ContributorActivity = {
  sampledItems: 12,
  respondedItems: 11,
  medianFirstResponseHours: 8,
  externalPullRequestsMerged: 8,
  externalPullRequestsClosed: 2,
  lastMergedPullRequestAt: "2026-10-10T00:00:00Z",
  unassignedGoodFirstIssues: 6,
};

const files = {
  readme: true,
  contributing: true,
  codeOfConduct: true,
  license: true,
  issueTemplate: true,
  pullRequestTemplate: true,
};

async function listedProject(githubRepoId: number, name: string, stars = 10) {
  const project = await Project.create({
    githubRepoId,
    ownerName: "gitify",
    name,
    repositoryUrl: `https://github.com/gitify/${name}`,
    language: "typescript",
    difficulty: "beginner",
    stars,
    detailsFetchedAt: now,
  });
  await ProjectSearchMembership.create({
    projectId: project.id,
    language: "typescript",
    difficulty: "beginner",
  });
  return project;
}

async function enrich(project: Project, insights: Partial<RepositoryInsights>) {
  const github = new FakeGitHubAdapter();
  github.snapshot.insights = { ...github.snapshot.insights, ...insights };
  await new GitHubSyncService(github, () => now).fetchProjectDetails(project, "token");
}

test.group("Newcomer score", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("is computed with each detail snapshot and exposed on the project page", async ({
    client,
    assert,
  }) => {
    const project = await listedProject(70001, "welcoming");
    await enrich(project, {
      contributorActivity: activity,
      health: { percentage: 100, files },
      lastCommitAt: "2026-10-11T00:00:00Z",
    });
    assert.equal(project.newcomerScore, 100);
    assert.notProperty(project.newcomerScoreDetails, "score");

    const page = await client.get("/projects/gitify/welcoming").withInertia();
    page.assertStatus(200);
    const details = page.inertiaProps.project.newcomerScoreDetails;
    assert.equal(details.score, 100);
    assert.isFalse(details.partial);
    assert.deepEqual(
      details.signals.map((signal: { key: string; value: number }) => [signal.key, signal.value]),
      [
        ["firstResponse", 8],
        ["externalMergeRate", 0.8],
        ["goodFirstIssues", 6],
        ["communityProfile", 4],
        ["maintainerActivity", 1],
      ],
    );

    const list = await client.get("/explore?level=all").withInertia();
    list.assertInertiaPropsContains({
      projects: {
        data: [{ id: project.id, newcomerScore: { score: 100, partial: false, archived: false } }],
      },
    });
  });

  test("degrades to a partial score when GitHub activity is missing", async ({ assert }) => {
    const project = await listedProject(70002, "quiet");
    await enrich(project, {
      contributorActivity: null,
      goodFirstIssues: 3,
      health: { percentage: 50, files: { ...files, codeOfConduct: false } },
      lastCommitAt: "2026-10-01T00:00:00Z",
    });
    assert.isNull(project.newcomerScore);
    assert.isTrue(project.newcomerScoreDetails?.partial);
    assert.equal(project.newcomerScoreDetails?.coverage, 0.35);

    await enrich(project, {
      contributorActivity: { ...activity, medianFirstResponseHours: null },
      health: null,
      lastCommitAt: "2026-10-01T00:00:00Z",
    });
    assert.isNumber(project.newcomerScore);
    assert.isTrue(project.newcomerScoreDetails?.partial);
  });

  test("sorts and filters the catalogue by score, and hides archived repositories", async ({
    client,
    assert,
  }) => {
    const popular = await listedProject(70010, "popular-unscored", 5000);
    const strong = await listedProject(70011, "strong", 10);
    const weak = await listedProject(70012, "weak", 100);
    const archived = await listedProject(70013, "archived", 9000);
    await enrich(strong, {
      contributorActivity: activity,
      health: { percentage: 100, files },
      lastCommitAt: "2026-10-11T00:00:00Z",
    });
    await enrich(weak, {
      contributorActivity: {
        ...activity,
        medianFirstResponseHours: 500,
        externalPullRequestsMerged: 1,
        externalPullRequestsClosed: 9,
        unassignedGoodFirstIssues: 0,
        lastMergedPullRequestAt: null,
      },
      health: { percentage: 20, files: { ...files, contributing: false, issueTemplate: false } },
      lastCommitAt: "2026-03-01T00:00:00Z",
    });
    await enrich(archived, { isArchived: true });
    assert.equal(archived.newcomerScore, 0);
    assert.isTrue(archived.isArchived);

    const ids = (response: { inertiaProps: Record<string, any> }) =>
      response.inertiaProps.projects.data.map((project: { id: string }) => project.id);

    const welcome = await client.get("/explore?level=all&sort=welcome").withInertia();
    assert.deepEqual(ids(welcome), [strong.id, weak.id, popular.id]);

    const filtered = await client.get("/explore?level=all&score=50").withInertia();
    assert.deepEqual(ids(filtered), [strong.id]);

    const stars = await client.get("/explore?level=all").withInertia();
    assert.notInclude(ids(stars), archived.id);
  });
});
