import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import type { IssueFilters } from "#shared/types/index";
import { githubIssue } from "#tests/helpers/fake_github_adapter";
import { issueFeedSetup as setup, issueFilters as filters } from "#tests/helpers/issue_feed";

const token = "issue-feed-token";

test.group("Issue feed filters", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

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
});
