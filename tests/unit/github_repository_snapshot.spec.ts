import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";
import { GitHubInvalidResponseError, GitHubUnavailableError } from "#services/github/github_errors";
import {
  graphqlActivityItem,
  graphqlRepository,
  restDetailsTransport,
} from "#tests/helpers/github_payloads";

const contributor = (id: number, login: string, type: string) => ({
  id,
  login,
  type,
  avatar_url: "https://github.com/avatar",
  html_url: `https://github.com/${login}`,
  contributions: 10,
});

function graphql(
  edit: (repository: ReturnType<typeof graphqlRepository>["data"]["repository"]) => void,
) {
  const payload = graphqlRepository();
  edit(payload.data.repository);
  return () => Response.json(payload);
}

test.group("GitHub repository snapshot", () => {
  test("assembles REST details with normalized contributors", async ({ assert }) => {
    const client = new GitHubApiClient(
      restDetailsTransport({
        "/contributors?per_page=1&anon=false": () =>
          Response.json([{}], {
            headers: {
              link: '<https://api.github.com/repos/owner/repo/contributors?per_page=1&page=3>; rel="last"',
            },
          }),
        "/contributors?per_page=30": () =>
          Response.json([contributor(1, "person", "User"), contributor(2, "bot", "Bot")]),
      }),
    );
    const snapshot = await client.getRepositorySnapshot("owner", "repo", "token");
    assert.equal(snapshot.readme, "# Fresh");
    assert.deepEqual(snapshot.languages, { TypeScript: 100 });
    assert.equal(snapshot.latestRelease, "v2");
    assert.equal(snapshot.totalContributorsCount, 3);
    assert.deepEqual(snapshot.contributors, [
      {
        id: 1,
        login: "person",
        avatarUrl: "https://github.com/avatar",
        profileUrl: "https://github.com/person",
        contributions: 10,
      },
    ]);
  });

  test("maps repository insights and follows shared community files", async ({ assert }) => {
    const requests: { url: string; method: string }[] = [];
    const transport = restDetailsTransport({
      "/graphql": graphql((repository) => {
        repository.licenseInfo = { spdxId: "NOASSERTION", name: "Other" };
        repository.homepageUrl = "";
        repository.watchers = { totalCount: 7 };
        repository.languages = {
          edges: [{ size: 10, node: { name: "TypeScript", color: "#3178c6" } }],
        } as never;
      }),
      "/community/profile": () =>
        Response.json({
          health_percentage: 42,
          files: {
            readme: {},
            contributing: { html_url: "https://github.com/org/.github/blob/main/CONTRIBUTING.md" },
          },
        }),
      "/repos/org/.github/contents/CONTRIBUTING.md?ref=main": () =>
        Response.json({ content: Buffer.from("# Help").toString("base64"), encoding: "base64" }),
    });
    const client = new GitHubApiClient(async (input, init) => {
      requests.push({ url: String(input), method: init?.method ?? "GET" });
      return transport(input, init);
    });

    const result = await client.getRepositorySnapshot("owner", "repo", "token");

    assert.equal(requests.find((r) => r.url.endsWith("/graphql"))?.method, "POST");
    assert.equal(result.repository.license, "Other");
    assert.isNull(result.repository.homepageUrl);
    assert.equal(result.insights.watchers, 7);
    assert.deepEqual(result.insights.languages, [
      { name: "TypeScript", color: "#3178c6", bytes: 10 },
    ]);
    assert.isNull(result.insights.weeklyCommits);
    assert.equal(result.insights.health?.percentage, 42);
    assert.isTrue(result.insights.health?.files.contributing);
    assert.isFalse(result.insights.health?.files.license);
    assert.equal(result.contributing, "# Help");
  });

  test("summarises outside contributor activity for the newcomer score", async ({ assert }) => {
    const answer = (createdAt: string) => [{ createdAt, authorAssociation: "MEMBER" }];
    const issue = (assigned: number) => ({
      number: assigned + 1,
      title: "Fix typo",
      url: "https://github.com/owner/repo/issues/1",
      createdAt: "2026-10-01T00:00:00Z",
      author: null,
      comments: { totalCount: 0 },
      labels: { nodes: [] },
      assignees: { totalCount: assigned },
    });
    const transport = restDetailsTransport({
      "/graphql": graphql((repository) => {
        repository.beginnerIssues = { nodes: [issue(0), issue(1)] } as never;
        repository.activityIssues.nodes = [
          graphqlActivityItem({
            createdAt: "2026-10-01T00:00:00Z",
            replies: answer("2026-10-01T04:00:00Z"),
          }),
          graphqlActivityItem({ createdAt: "2026-10-01T00:00:00Z", authorAssociation: "OWNER" }),
        ];
        repository.activityPullRequests.nodes = [
          graphqlActivityItem({
            createdAt: "2026-10-02T00:00:00Z",
            state: "MERGED",
            mergedAt: "2026-10-02T12:00:00Z",
          }),
          graphqlActivityItem({
            createdAt: "2026-10-03T00:00:00Z",
            state: "CLOSED",
            replies: answer("2026-10-03T08:00:00Z"),
          }),
          graphqlActivityItem({ state: "MERGED", bot: true, mergedAt: "2026-10-03T00:00:00Z" }),
        ];
        repository.lastMergedPullRequest.nodes = [{ mergedAt: "2026-10-02T12:00:00Z" }];
      }),
    });
    const client = new GitHubApiClient(transport, 10_000, () => new Date("2026-10-12T00:00:00Z"));

    const { insights } = await client.getRepositorySnapshot("owner", "repo", "token");
    assert.deepEqual(insights.contributorActivity, {
      sampledItems: 3,
      respondedItems: 3,
      medianFirstResponseHours: 8,
      externalPullRequestsMerged: 1,
      externalPullRequestsClosed: 1,
      lastMergedPullRequestAt: "2026-10-02T12:00:00Z",
      unassignedGoodFirstIssues: 1,
    });
  });

  test("rejects GraphQL answers without a repository", async ({ assert }) => {
    const client = new GitHubApiClient(
      restDetailsTransport({
        "/graphql": () =>
          Response.json({ data: { repository: null }, errors: [{ message: "Could not resolve" }] }),
      }),
    );
    const error = await client.getRepositorySnapshot("owner", "gone", "token").catch((e) => e);
    assert.instanceOf(error, GitHubInvalidResponseError);
    assert.match(error.message, /Invalid GitHub response: insights \(Could not resolve\)/);
  });

  test("fails the whole snapshot when only one of its parts is unavailable", async ({ assert }) => {
    for (const part of ["/graphql", "/languages", "/stats/commit_activity"]) {
      const client = new GitHubApiClient(
        restDetailsTransport({ [part]: () => new Response(null, { status: 502 }) }),
      );
      const error = await client.getRepositorySnapshot("owner", "repo", "token").catch((e) => e);
      assert.instanceOf(error, GitHubUnavailableError, part);
      assert.equal(error.status, 502);
    }
  });
});
