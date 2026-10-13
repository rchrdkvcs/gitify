import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";
import { graphqlActivityItem, graphqlRepository } from "#tests/helpers/fake_github_adapter";

test.group("GitHub HTTP adapter", () => {
  test("uses independent transports and credentials without replacing global fetch", async ({
    assert,
  }) => {
    const originalFetch = globalThis.fetch;
    const calls: { url: string; authorization: string }[] = [];
    const transport: typeof fetch = async (input, init) => {
      calls.push({
        url: String(input),
        authorization: new Headers(init?.headers).get("Authorization")!,
      });
      return Response.json({ items: [{ id: 42 }] });
    };
    const first = new GitHubApiClient(transport);
    const second = new GitHubApiClient(async () => Response.json({ items: [{ id: 84 }] }));
    assert.deepEqual(await first.searchRepositories("typescript", "beginner", "first-token", 5), [
      { id: 42 },
    ]);
    assert.deepEqual(await second.searchRepositories("rust", "expert", "second-token"), [
      { id: 84 },
    ]);
    assert.lengthOf(calls, 1);
    const url = new URL(calls[0].url);
    assert.equal(
      url.searchParams.get("q"),
      "language:typescript archived:false is:public good-first-issues:>0",
    );
    assert.equal(url.searchParams.get("per_page"), "5");
    assert.equal(calls[0].authorization, "Bearer first-token");
    assert.strictEqual(globalThis.fetch, originalFetch);
  });

  test("assembles repository details through its injected transport", async ({ assert }) => {
    const client = new GitHubApiClient(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/readme")) {
        return Response.json({
          content: Buffer.from("# README").toString("base64"),
          encoding: "base64",
        });
      }
      if (url.pathname.endsWith("/languages")) {
        return Response.json({ TypeScript: 100 });
      }
      if (url.pathname.endsWith("/releases/latest")) {
        return Response.json({ tag_name: "v1" });
      }
      if (url.searchParams.get("per_page") === "1") {
        return Response.json([{}], {
          headers: {
            link: '<https://api.github.com/repos/owner/repo/contributors?per_page=1&page=3>; rel="last"',
          },
        });
      }
      return Response.json([
        {
          id: 1,
          login: "person",
          type: "User",
          avatar_url: "https://github.com/avatar",
          html_url: "https://github.com/person",
          contributions: 10,
        },
        {
          id: 2,
          login: "bot",
          type: "Bot",
          avatar_url: "https://github.com/avatar",
          html_url: "https://github.com/bot",
          contributions: 5,
        },
      ]);
    });
    const details = await client.getProjectDetails("owner", "repo", "token");
    assert.equal(details.readme, "# README");
    assert.deepEqual(details.languages, { TypeScript: 100 });
    assert.equal(details.latestRelease, "v1");
    assert.equal(details.totalContributorsCount, 3);
    assert.deepEqual(
      details.contributors.map((person) => person.login),
      ["person"],
    );
  });

  test("maps repository insights and follows shared community files", async ({ assert }) => {
    const requests: { url: string; method: string }[] = [];
    const client = new GitHubApiClient(async (input, init) => {
      const url = String(input);
      requests.push({ url, method: init?.method ?? "GET" });
      if (url.endsWith("/graphql")) {
        const payload = graphqlRepository();
        payload.data.repository.licenseInfo = { spdxId: "NOASSERTION", name: "Other" } as never;
        payload.data.repository.watchers = { totalCount: 7 };
        payload.data.repository.languages = {
          edges: [{ size: 10, node: { name: "TypeScript", color: "#3178c6" } }],
        } as never;
        return Response.json(payload);
      }
      if (url.endsWith("/community/profile")) {
        return Response.json({
          health_percentage: 42,
          files: {
            readme: {},
            contributing: { html_url: "https://github.com/org/.github/blob/main/CONTRIBUTING.md" },
          },
        });
      }
      if (url.endsWith("/stats/commit_activity")) {
        return new Response(null, { status: 202 });
      }
      if (url.includes("/repos/org/.github/contents/CONTRIBUTING.md?ref=main")) {
        return Response.json({
          content: Buffer.from("# Help").toString("base64"),
          encoding: "base64",
        });
      }
      return new Response(null, { status: 404 });
    });

    const result = await client.getRepositoryInsights("owner", "repo", "token");

    assert.equal(requests.find((r) => r.url.endsWith("/graphql"))?.method, "POST");
    assert.equal(result.metadata.license, "Other");
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
    const client = new GitHubApiClient(
      async (input) => {
        const url = String(input);
        if (url.endsWith("/graphql")) {
          const payload = graphqlRepository();
          const repository = payload.data.repository;
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
          return Response.json(payload);
        }
        return new Response(null, { status: url.endsWith("/commit_activity") ? 202 : 404 });
      },
      10_000,
      () => new Date("2026-10-12T00:00:00Z"),
    );

    const { insights } = await client.getRepositoryInsights("owner", "repo", "token");
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

  test("lists the languages of the user's own repositories, forks excluded", async ({ assert }) => {
    const urls: string[] = [];
    const client = new GitHubApiClient(async (input) => {
      urls.push(String(input));
      return Response.json([
        { language: "Rust", fork: false },
        { language: "Go", fork: true },
        { language: null, fork: false },
      ]);
    });
    assert.deepEqual(await client.listUserRepositoryLanguages("token"), ["Rust", null]);
    assert.include(urls[0], "/user/repos?affiliation=owner&sort=pushed");
  });

  test("rejects GraphQL answers without a repository", async ({ assert }) => {
    const client = new GitHubApiClient(async (input) =>
      String(input).endsWith("/graphql")
        ? Response.json({ data: { repository: null }, errors: [{ message: "Could not resolve" }] })
        : Response.json([]),
    );
    await assert.rejects(
      () => client.getRepositoryInsights("owner", "gone", "token"),
      /Invalid GitHub response: insights \(Could not resolve\)/,
    );
  });
});
