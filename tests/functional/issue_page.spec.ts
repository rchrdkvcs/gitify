import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import IssueSearchCache from "#models/issue_search_cache";
import User from "#models/user";
import { githubIssue } from "#tests/helpers/fake_github_adapter";
import { issueFeedSetup as setup } from "#tests/helpers/issue_feed";

const token = "issue-page-token";

test.group("Issues page", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("the page is public and applies the reader's preferences", async ({ client, assert }) => {
    const { github, sync } = setup();
    github.issues = [githubIssue({ title: "Beginner issue" })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "good-first-issue", token });
    github.issues = [githubIssue({ id: 5002, title: "Expert issue" })];
    await sync.ensureIssuesFresh({ language: "typescript", kind: "help-wanted", token });
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
    assert.deepEqual(explicit.inertiaProps.filters.languages, ["typescript"]);
    assert.deepEqual(
      explicit.inertiaProps.issues.data.map((issue: { title: string }) => issue.title),
      ["Expert issue"],
    );

    const project = await client.get("/projects/owner/repo-201").withInertia();
    project.assertStatus(200);
  });
});
