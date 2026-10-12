import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";

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
});
