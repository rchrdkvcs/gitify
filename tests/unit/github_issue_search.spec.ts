import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";
import { isContributable } from "#services/github/github_issue_sync_service";
import { githubIssue } from "#tests/helpers/fake_github_adapter";

function graphqlIssue(overrides: Record<string, unknown> = {}) {
  return {
    databaseId: 9001,
    number: 12,
    title: "Document the CLI flags",
    url: "https://github.com/acme/tool/issues/12",
    createdAt: "2026-10-01T00:00:00Z",
    comments: { totalCount: 2 },
    assignees: { totalCount: 0 },
    closedByPullRequestsReferences: { totalCount: 0 },
    labels: { nodes: [{ name: "good first issue", color: "7057ff" }] },
    repository: {
      databaseId: 77,
      name: "tool",
      url: "https://github.com/acme/tool",
      description: "A tool",
      homepageUrl: "",
      pushedAt: "2026-10-02T00:00:00Z",
      createdAt: "2020-01-01T00:00:00Z",
      isArchived: false,
      isPrivate: false,
      stargazerCount: 1200,
      forkCount: 30,
      owner: { login: "acme", avatarUrl: "https://avatars.githubusercontent.com/u/9" },
      primaryLanguage: { name: "Rust" },
      licenseInfo: { spdxId: "NOASSERTION", name: "Custom" },
      repositoryTopics: { nodes: [{ topic: { name: "cli" } }] },
      issues: { totalCount: 8 },
      pullRequests: { totalCount: 2 },
    },
    ...overrides,
  };
}

test.group("GitHub issue search", () => {
  test("searches open public issues of a label family through GraphQL", async ({ assert }) => {
    const calls: { url: string; body: { variables: Record<string, unknown> } }[] = [];
    const client = new GitHubApiClient(async (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      // Pull requests matched by the search union come back as empty objects.
      return Response.json({ data: { search: { nodes: [graphqlIssue(), {}] } } });
    });

    const issues = await client.searchIssues("rust", "good-first-issue", "token", 5);

    assert.equal(calls[0].url, "https://api.github.com/graphql");
    assert.equal(
      calls[0].body.variables.query,
      'is:issue is:open is:public archived:false -linked:pr language:rust label:"good first issue" sort:created-desc',
    );
    assert.equal(calls[0].body.variables.first, 5);
    assert.deepEqual(issues, [
      {
        id: 9001,
        number: 12,
        title: "Document the CLI flags",
        url: "https://github.com/acme/tool/issues/12",
        createdAt: "2026-10-01T00:00:00Z",
        comments: 2,
        assignees: 0,
        linkedPullRequests: 0,
        labels: [{ name: "good first issue", color: "7057ff" }],
        repository: {
          id: 77,
          name: "tool",
          ownerLogin: "acme",
          ownerAvatarUrl: "https://avatars.githubusercontent.com/u/9",
          url: "https://github.com/acme/tool",
          description: "A tool",
          stars: 1200,
          forksCount: 30,
          openIssuesCount: 10,
          language: "Rust",
          topics: ["cli"],
          homepageUrl: null,
          license: "Custom",
          pushedAt: "2026-10-02T00:00:00Z",
          createdAt: "2020-01-01T00:00:00Z",
          isArchived: false,
          isPrivate: false,
        },
      },
    ]);
  });

  test("rejects GraphQL errors and HTTP failures", async ({ assert }) => {
    const errors = new GitHubApiClient(async () =>
      Response.json({ errors: [{ message: "rate limited" }] }),
    );
    await assert.rejects(
      () => errors.searchIssues("go", "help-wanted", "token"),
      /Invalid GitHub response: issues \(rate limited\)/,
    );
    const failure = new GitHubApiClient(async () => new Response(null, { status: 502 }));
    await assert.rejects(() => failure.searchIssues("go", "help-wanted", "token"), /502/);
  });

  test("keeps only issues of public active repositories without a linked pull request", ({
    assert,
  }) => {
    assert.isTrue(isContributable(githubIssue()));
    assert.isFalse(isContributable(githubIssue({ linkedPullRequests: 1 })));
    assert.isFalse(isContributable(githubIssue({ repository: { isArchived: true } })));
    assert.isFalse(isContributable(githubIssue({ repository: { isPrivate: true } })));
  });
});
