import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import IssueSearchMembership from "#models/issue_search_membership";
import Project from "#models/project";
import ProjectIssue from "#models/project_issue";
import ProjectSearchMembership from "#models/project_search_membership";
import IssueFeed from "#services/feeds/issue_feed";
import GitHubIssueSyncService from "#services/github/github_issue_sync_service";
import { FakeGitHubAdapter, githubIssue } from "#tests/helpers/fake_github_adapter";
import {
  issueFeedSetup as setup,
  issueFilters as filters,
  issueFeedNow as now,
} from "#tests/helpers/issue_feed";

const token = "issue-feed-token";
test.group("Issue feed", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("stores contributable issues and links them to their repository", async ({ assert }) => {
    const { github, feed } = setup();
    github.issues = [
      githubIssue({ id: 5001, title: "Fix the docs", comments: 3 }),
      githubIssue({ id: 5002, linkedPullRequests: 1 }),
      githubIssue({ id: 5003, repository: { id: 202, name: "archived", isArchived: true } }),
      githubIssue({ id: 5004, repository: { id: 203, name: "secret", isPrivate: true } }),
    ];

    const result = await feed.explore(filters(), 1, { token });

    assert.deepEqual(github.issueSearchCalls, [
      { language: "typescript", kind: "good-first-issue", token, perPage: 100 },
    ]);
    assert.equal(result.refreshState, "ready");
    assert.equal(result.meta.total, 1);
    assert.deepEqual(result.issues[0], {
      id: result.issues[0].id,
      number: 1,
      title: "Fix the docs",
      url: "https://github.com/owner/repo-201/issues/1",
      createdAt: result.issues[0].createdAt,
      comments: 3,
      labels: [{ name: "good first issue", color: "7057ff" }],
      isAssigned: false,
      isGoodFirstIssue: true,
      isHelpWanted: false,
      project: {
        id: result.issues[0].project.id,
        name: "repo-201",
        ownerName: "owner",
        ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
        language: "typescript",
        stars: 10,
      },
    });
    assert.equal(Date.parse(result.issues[0].createdAt!), Date.parse("2026-10-01T00:00:00Z"));
    const project = await Project.findByOrFail("githubRepoId", 201);
    assert.equal(project.id, result.issues[0].project.id);
    assert.equal(project.difficulty, "beginner");
    assert.isNull(await Project.findBy("githubRepoId", 202));
    assert.isNull(await ProjectSearchMembership.findBy("projectId", project.id));
  });

  test("reuses an existing project and refreshes its metadata", async ({ assert }) => {
    const existing = await Project.create({
      githubRepoId: 201,
      name: "old-name",
      ownerName: "owner",
      repositoryUrl: "https://github.com/owner/old-name",
      difficulty: "expert",
      language: "typescript",
      stars: 1,
      topics: ["kept"],
    });
    const { github, feed } = setup();
    github.issues = [githubIssue({ repository: { stars: 99, topics: ["truncated"] } })];

    await feed.explore(filters(), 1, { token });

    await existing.refresh();
    assert.equal(existing.name, "repo-201");
    assert.equal(existing.stars, 99);
    assert.equal(existing.difficulty, "expert");
    assert.deepEqual(existing.topics, ["kept"]);
    assert.lengthOf(await ProjectIssue.query().where("projectId", existing.id), 1);
  });

  test("a refreshed snapshot retires issues no search lists anymore", async ({ assert }) => {
    const { github, clock, sync, feed } = setup();
    github.issues = [githubIssue({ id: 5001 }), githubIssue({ id: 5002 })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });
    await sync.ensureIssuesFresh({ language: "typescript", kind: "documentation", token });

    clock.now = now.plus({ hours: 6 });
    github.issues = [githubIssue({ id: 5003, title: "New one" })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });

    const beginner = await feed.explore(filters(), 1, { token: null });
    assert.deepEqual(
      beginner.issues.map((issue) => issue.title),
      ["New one"],
    );
    const all = await feed.explore(filters({ kind: "all" }), 1, { token: null });
    assert.sameMembers(
      all.issues.map((issue) => issue.number),
      [1, 2, 3],
    );
    clock.now = now.plus({ hours: 12 });
    await sync.ensureIssuesFresh({ language: "typescript", kind: "documentation", token });
    const remaining = await ProjectIssue.all();
    assert.deepEqual(
      remaining.map((issue) => Number(issue.githubIssueId)),
      [5003],
    );
  });

  test("snapshots stay fresh until their TTL expires", async ({ assert }) => {
    const { github, clock, sync } = setup();
    const criteria = { language: " TypeScript ", kind: "help-wanted" as const, token };
    assert.deepEqual(await sync.ensureIssuesFresh(criteria), {
      status: "refreshed",
      totalStored: 0,
    });
    clock.now = now.plus({ hours: 5 });
    assert.deepEqual(await sync.ensureIssuesFresh(criteria), { status: "fresh" });
    clock.now = now.plus({ hours: 6 });
    assert.deepEqual(await sync.ensureIssuesFresh(criteria), {
      status: "refreshed",
      totalStored: 0,
    });
    assert.lengthOf(github.issueSearchCalls, 2);
    assert.equal(github.issueSearchCalls[0].language, "typescript");
  });

  test("keeps the previous snapshot when GitHub fails and defers retries", async ({ assert }) => {
    const { github, clock, feed } = setup();
    github.issues = [githubIssue({ title: "Cached issue" })];
    await feed.explore(filters(), 1, { token });

    clock.now = now.plus({ hours: 7 });
    github.issueSearchError = new Error(`Remote outage ${token}`);
    const degraded = await feed.explore(filters(), 1, { token });
    assert.equal(degraded.refreshState, "degraded");
    assert.deepEqual(
      degraded.issues.map((issue) => issue.title),
      ["Cached issue"],
    );
    assert.notInclude(JSON.stringify(degraded), token);

    const other = new FakeGitHubAdapter();
    const deferred = await new IssueFeed(
      new GitHubIssueSyncService(other, () => clock.now),
    ).explore(filters(), 1, { token });
    assert.equal(deferred.refreshState, "degraded");
    assert.isEmpty(other.issueSearchCalls);
    assert.lengthOf(github.issueSearchCalls, 2);

    clock.now = clock.now.plus({ seconds: 60 });
    github.issueSearchError = undefined;
    github.issues = [githubIssue({ id: 5009, title: "Recovered" })];
    const recovered = await feed.explore(filters(), 1, { token });
    assert.equal(recovered.refreshState, "ready");
    assert.deepEqual(
      recovered.issues.map((issue) => issue.title),
      ["Recovered"],
    );
  });

  test("reports an unavailable feed when no snapshot exists", async ({ assert }) => {
    const { github, feed } = setup();
    github.issueSearchError = new Error("GitHub unavailable");
    const result = await feed.explore(filters(), 1, { token });
    assert.equal(result.refreshState, "unavailable");
    assert.isEmpty(result.issues);
  });

  test("only the first page refreshes and guests without a token read the cache", async ({
    assert,
  }) => {
    const { github, feed } = setup();
    await feed.explore(filters(), 2, { token });
    await feed.explore(filters(), 1, { token: null });
    assert.isEmpty(github.issueSearchCalls);
    const all = await feed.explore(filters({ kind: "all", languages: ["rust"] }), 1, { token });
    assert.lengthOf(github.issueSearchCalls, 2);
    assert.equal(all.refreshState, "refreshing");
  });

  test("deleting a project removes its issues and memberships", async ({ assert }) => {
    const { github, sync } = setup();
    github.issues = [githubIssue()];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });
    const project = await Project.findByOrFail("githubRepoId", 201);
    await project.delete();
    assert.lengthOf(await ProjectIssue.all(), 0);
    assert.lengthOf(await IssueSearchMembership.all(), 0);
  });
});
