import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";
import {
  GitHubAuthError,
  GitHubInvalidResponseError,
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubUnavailableError,
} from "#services/github/github_errors";
import { restDetailsTransport } from "#tests/helpers/github_payloads";

const endpoints = [
  "/readme",
  "/languages",
  "/contributors?per_page=30",
  "/releases/latest",
  "/contributors?per_page=1&anon=false",
  "/graphql",
  "/community/profile",
  "/stats/commit_activity",
];

const statusErrors = [
  { status: 401, type: GitHubAuthError },
  { status: 403, type: GitHubAuthError },
  { status: 429, type: GitHubRateLimitError },
  { status: 503, type: GitHubUnavailableError },
];

function failing(
  endpoint: string,
  status: number,
  headers: Record<string, string> = {},
): typeof fetch {
  return restDetailsTransport({ [endpoint]: () => new Response(null, { status, headers }) });
}

async function failure(promise: Promise<unknown>): Promise<any> {
  return promise.then(
    () => {
      throw new Error("Expected a GitHub failure");
    },
    (error) => error,
  );
}

function snapshot(request: typeof fetch, timeoutMs?: number) {
  return new GitHubApiClient(request, timeoutMs).getRepositorySnapshot("owner", "repo", "token");
}

test.group("GitHub HTTP errors", () => {
  for (const endpoint of endpoints) {
    for (const { status, type } of statusErrors) {
      test(`rejects ${status} on ${endpoint} with ${type.name}`, async ({ assert }) => {
        const error = await failure(snapshot(failing(endpoint, status)));
        assert.instanceOf(error, type);
        assert.equal(error.status, status);
      });
    }
  }

  test("classifies a rate-limited 403 with its reset time", async ({ assert }) => {
    const reset = Math.floor(Date.UTC(2026, 9, 13, 12) / 1000);
    const error = await failure(
      snapshot(
        failing("/languages", 403, {
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(reset),
        }),
      ),
    );
    assert.instanceOf(error, GitHubRateLimitError);
    assert.equal(error.resetAt.getTime(), reset * 1000);
  });

  test("dates a secondary rate limit from its retry delay", async ({ assert }) => {
    const now = new Date("2026-10-13T12:00:00Z");
    const client = new GitHubApiClient(
      failing("/readme", 403, { "retry-after": "30" }),
      10_000,
      () => now,
    );
    const error = await failure(client.getRepositorySnapshot("owner", "repo", "token"));
    assert.instanceOf(error, GitHubRateLimitError);
    assert.equal(error.resetAt.getTime(), now.getTime() + 30_000);
  });

  test("only optional endpoints accept 404 as absence", async ({ assert }) => {
    const withoutReadme = await snapshot(failing("/readme", 404));
    const withoutRelease = await snapshot(failing("/releases/latest", 404));
    const withoutProfile = await snapshot(failing("/community/profile", 404));
    assert.isNull(withoutReadme.readme);
    assert.isNull(withoutRelease.latestRelease);
    assert.isNull(withoutProfile.insights.health);
    for (const endpoint of ["/languages", "/contributors?per_page=30", "/graphql"]) {
      assert.instanceOf(await failure(snapshot(failing(endpoint, 404))), GitHubNotFoundError);
    }
  });

  test("rejects malformed successful details instead of publishing a partial cache", async ({
    assert,
  }) => {
    const request = restDetailsTransport({
      "/languages": () => Response.json({ TypeScript: "invalid" }),
    });
    assert.instanceOf(await failure(snapshot(request)), GitHubInvalidResponseError);
  });

  test("represents an empty repository with contributor 204 responses", async ({ assert }) => {
    const empty = () => new Response(null, { status: 204 });
    const request = restDetailsTransport({
      "/readme": () => new Response(null, { status: 404 }),
      "/releases/latest": () => new Response(null, { status: 404 }),
      "/languages": () => Response.json({}),
      "/contributors?per_page=30": empty,
      "/contributors?per_page=1&anon=false": empty,
      "/stats/commit_activity": empty,
    });
    const result = await snapshot(request);
    assert.deepInclude(result, {
      readme: null,
      languages: {},
      contributors: [],
      latestRelease: null,
      totalContributorsCount: 0,
    });
    assert.deepEqual(result.insights.weeklyCommits, []);
  });

  test("rejects unexpected empty responses on the remaining endpoints", async ({ assert }) => {
    for (const endpoint of ["/readme", "/languages", "/releases/latest"]) {
      assert.instanceOf(
        await failure(snapshot(failing(endpoint, 204))),
        GitHubInvalidResponseError,
      );
    }
  });

  for (const phase of ["headers", "body"]) {
    test(`bounds remote ${phase} wait and aborts transport`, async ({ assert }) => {
      let signal: AbortSignal | null | undefined;
      const request: typeof fetch = async (input, init) => {
        if (!String(input).endsWith("/readme")) {
          return restDetailsTransport()(input, init);
        }
        signal = init?.signal;
        if (phase === "headers") {
          return new Promise<Response>(() => {});
        }
        return new Response(new ReadableStream({ start() {} }));
      };
      const error = await failure(snapshot(request, 20));
      assert.instanceOf(error, GitHubUnavailableError);
      assert.match(error.message, /GitHub request timed out/);
      assert.isTrue(signal?.aborted);
    });
  }
});
