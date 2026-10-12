import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import type { IssueFilters } from "#shared/types/index";
import IssueSearchCache from "#models/issue_search_cache";
import IssueSearchMembership from "#models/issue_search_membership";
import Project from "#models/project";
import ProjectIssue from "#models/project_issue";
import ProjectSearchMembership from "#models/project_search_membership";
import User from "#models/user";
import { GitHubIssueSyncService } from "#services/github/github_issue_sync_service";
import { IssueFeedService } from "#services/issue_feed_service";
import { FakeGitHubAdapter, githubIssue } from "#tests/helpers/fake_github_adapter";

const token = "issue-feed-token";
const now = DateTime.fromISO("2026-10-12T12:00:00Z");

function filters(overrides: Partial<IssueFilters> = {}): IssueFilters {
  return {
    q: "",
    languages: ["typescript"],
    kind: "good-first-issue",
    unassigned: true,
    sort: "recent",
    ...overrides,
  };
}

function setup() {
  const github = new FakeGitHubAdapter();
  const clock = { now };
  const sync = new GitHubIssueSyncService(github, () => clock.now);
  return { github, clock, sync, feed: new IssueFeedService(sync) };
}

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
    // The repository joins the catalogue only through its own repository searches.
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
    // Still listed by the documentation search: kept, but no longer as a beginner issue.
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

    // The cooldown is shared: another instance does not call GitHub again.
    const other = new FakeGitHubAdapter();
    const deferred = await new IssueFeedService(
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
    const cache = await IssueSearchCache.findByOrFail("kind", "good-first-issue");
    assert.isNull(cache.retryAfter);
  });

  test("reports an unavailable feed when no snapshot exists", async ({ assert }) => {
    const { github, feed } = setup();
    github.issueSearchError = new Error("GitHub unavailable");
    const result = await feed.explore(filters(), 1, { token });
    assert.equal(result.refreshState, "unavailable");
    assert.isEmpty(result.issues);
    const cache = await IssueSearchCache.findByOrFail("language", "typescript");
    assert.isNull(cache.fetchedAt);
  });

  test("only the first page refreshes and guests without a token read the cache", async ({
    assert,
  }) => {
    const { github, feed } = setup();
    await feed.explore(filters(), 2, { token });
    await feed.explore(filters(), 1, { token: null });
    assert.isEmpty(github.issueSearchCalls);
    // Every kind is requested; the shared search budget defers the third one.
    const all = await feed.explore(filters({ kind: "all", languages: ["rust"] }), 1, { token });
    assert.lengthOf(github.issueSearchCalls, 2);
    assert.equal(all.refreshState, "refreshing");
  });

  test("filters by assignment, kind, language and text, and sorts", async ({ assert }) => {
    const { github, sync, feed } = setup();
    github.issues = [
      githubIssue({
        id: 5001,
        title: "Parser crash",
        comments: 5,
        createdAt: "2026-10-03T00:00:00Z",
      }),
      githubIssue({
        id: 5002,
        title: "Taken already",
        assignees: 1,
        createdAt: "2026-10-04T00:00:00Z",
      }),
      githubIssue({
        id: 5003,
        title: "Popular repo issue",
        comments: 1,
        createdAt: "2026-10-01T00:00:00Z",
        repository: { id: 301, name: "popular", stars: 5000 },
      }),
    ];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });
    github.issues = [
      githubIssue({ id: 5004, title: "Rust help", repository: { id: 401, name: "rust-repo" } }),
    ];
    await sync.ensureIssuesFresh({ language: "rust", kind: "help-wanted", token });

    const titles = async (overrides: Partial<IssueFilters>) => {
      const result = await feed.explore(filters(overrides), 1, { token: null });
      return result.issues.map((issue) => issue.title);
    };

    assert.deepEqual(await titles({}), ["Parser crash", "Popular repo issue"]);
    assert.deepEqual(await titles({ unassigned: false }), [
      "Taken already",
      "Parser crash",
      "Popular repo issue",
    ]);
    assert.deepEqual(await titles({ sort: "comments" }), ["Popular repo issue", "Parser crash"]);
    assert.deepEqual(await titles({ sort: "stars" }), ["Popular repo issue", "Parser crash"]);
    assert.deepEqual(await titles({ q: "PARSER" }), ["Parser crash"]);
    assert.deepEqual(await titles({ q: "popular" }), ["Popular repo issue"]);
    assert.deepEqual(await titles({ q: "100%_" }), []);
    assert.deepEqual(await titles({ languages: ["rust"], kind: "all" }), ["Rust help"]);
    assert.deepEqual(await titles({ languages: [], kind: "help-wanted" }), ["Rust help"]);
    assert.lengthOf(await titles({ languages: [], kind: "all" }), 3);
  });

  test("the page is public and applies the reader's preferences", async ({ client, assert }) => {
    const { github, sync } = setup();
    github.issues = [githubIssue({ title: "Beginner issue" })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });
    github.issues = [githubIssue({ id: 5002, title: "Expert issue" })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "help-wanted", token });
    // Fresh snapshots for every kind keep the signed-in request away from GitHub.
    await IssueSearchCache.create({
      language: "typescript",
      kind: "documentation",
      totalStored: 0,
      fetchedAt: DateTime.now(),
    });
    await IssueSearchCache.query().update({ fetched_at: DateTime.now().toSQL() });

    const guest = await client.get("/issues").withInertia();
    guest.assertStatus(200);
    guest.assertInertiaComponent("issues");
    assert.equal(guest.inertiaProps.filters.kind, "all");
    assert.equal(guest.inertiaProps.total, 2);
    assert.includeMembers(
      guest.inertiaProps.kindOptions.map((option: { value: string }) => option.value),
      ["good-first-issue", "help-wanted", "documentation"],
    );
    assert.isNotEmpty(guest.inertiaProps.languageOptions);

    const user = await User.create({
      email: "issues@example.com",
      name: "Issue reader",
      githubAccessToken: "private-issue-token",
      preferences: {
        level: "first_contribution",
        languages: ["typescript"],
        contributionTypes: ["code"],
        topics: [],
      },
    });
    const personal = await client.get("/issues").loginAs(user).withInertia();
    personal.assertStatus(200);
    personal.assertInertiaPropsContains({
      filters: { kind: "good-first-issue", languages: ["typescript"], unassigned: true },
      issues: { data: [{ title: "Beginner issue", project: { ownerName: "owner" } }] },
      refreshState: "ready",
    });
    assert.notInclude(JSON.stringify(personal.body()), "private-issue-token");

    const explicit = await client.get("/issues?label=help-wanted").loginAs(user).withInertia();
    assert.deepEqual(explicit.inertiaProps.filters.languages, []);
    assert.deepEqual(
      explicit.inertiaProps.issues.data.map((issue: { title: string }) => issue.title),
      ["Expert issue"],
    );

    const project = await client.get("/projects/owner/repo-201").withInertia();
    project.assertStatus(200);
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
