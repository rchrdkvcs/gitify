import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";

const endpoints = [
  "/readme",
  "/languages",
  "/contributors?per_page=10",
  "/releases/latest",
  "/contributors?per_page=1&anon=false",
];

function transport(failedEndpoint?: string, status = 200): typeof fetch {
  return async (input) => {
    const url = String(input);
    if (failedEndpoint && url.endsWith(failedEndpoint)) {
      return new Response(null, { status });
    }
    if (url.endsWith("/readme")) {
      return Response.json({
        content: Buffer.from("# Fresh").toString("base64"),
        encoding: "base64",
      });
    }
    if (url.endsWith("/languages")) {
      return Response.json({ TypeScript: 100 });
    }
    if (url.endsWith("/releases/latest")) {
      return Response.json({ tag_name: "v2" });
    }
    return Response.json([]);
  };
}

test.group("GitHub HTTP errors", () => {
  for (const endpoint of endpoints) {
    for (const status of [401, 403, 429, 503]) {
      test(`rejects ${status} on ${endpoint}`, async ({ assert }) => {
        await assert.rejects(
          () =>
            new GitHubApiClient(transport(endpoint, status)).getProjectDetails(
              "owner",
              "repo",
              "token",
            ),
          new RegExp(`GitHub API error: ${status}`),
        );
      });
    }
  }

  test("only optional endpoints accept 404 as absence", async ({ assert }) => {
    for (const endpoint of ["/readme", "/releases/latest"]) {
      const result = await new GitHubApiClient(transport(endpoint, 404)).getProjectDetails(
        "owner",
        "repo",
        "token",
      );
      assert.isNull(endpoint === "/readme" ? result.readme : result.latestRelease);
    }
    for (const endpoint of endpoints.filter(
      (item) => item !== "/readme" && item !== "/releases/latest",
    )) {
      await assert.rejects(
        () =>
          new GitHubApiClient(transport(endpoint, 404)).getProjectDetails("owner", "repo", "token"),
        /GitHub API error: 404/,
      );
    }
  });

  test("rejects malformed successful details instead of publishing a partial cache", async ({
    assert,
  }) => {
    const request: typeof fetch = async (input) =>
      String(input).endsWith("/languages")
        ? Response.json({ TypeScript: "invalid" })
        : transport()(input);
    await assert.rejects(
      () => new GitHubApiClient(request).getProjectDetails("owner", "repo", "token"),
      /Invalid GitHub response/,
    );
  });
  test("represents an empty repository with contributor 204 responses", async ({ assert }) => {
    const request: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/readme") || url.endsWith("/releases/latest")) {
        return new Response(null, { status: 404 });
      }
      if (url.includes("/contributors?")) {
        return new Response(null, { status: 204 });
      }
      return Response.json({});
    };
    const details = await new GitHubApiClient(request).getProjectDetails("owner", "empty", "token");
    assert.deepEqual(details, {
      readme: null,
      languages: {},
      contributors: [],
      latestRelease: null,
      totalContributorsCount: 0,
    });
  });

  test("rejects unexpected empty responses on the remaining endpoints", async ({ assert }) => {
    for (const endpoint of ["/readme", "/languages", "/releases/latest"]) {
      await assert.rejects(() =>
        new GitHubApiClient(transport(endpoint, 204)).getProjectDetails("owner", "repo", "token"),
      );
    }
  });

  for (const phase of ["headers", "body"]) {
    test(`bounds remote ${phase} wait and aborts transport`, async ({ assert }) => {
      let signal: AbortSignal | null | undefined;
      const request: typeof fetch = async (input, init) => {
        if (!String(input).endsWith("/readme")) {
          return transport()(input, init);
        }
        signal = init?.signal;
        if (phase === "headers") {
          return new Promise<Response>(() => {});
        }
        return new Response(new ReadableStream({ start() {} }));
      };
      const github = new GitHubApiClient(request, 20);
      await assert.rejects(
        () => github.getProjectDetails("owner", "repo", "token"),
        /GitHub request timed out/,
      );
      assert.isTrue(signal?.aborted);
    });
  }
});
