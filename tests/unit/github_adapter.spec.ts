import { test } from "@japa/runner";
import { GitHubApiClient } from "#services/github/github_api_client";
import { GitHubInvalidResponseError } from "#services/github/github_errors";

function restRepository(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    name: "tool",
    owner: { login: "acme", avatar_url: "https://avatars.githubusercontent.com/u/9" },
    html_url: "https://github.com/acme/tool",
    homepage: "",
    license: { spdx_id: "NOASSERTION", name: "Other" },
    pushed_at: "2026-10-02T00:00:00Z",
    created_at: "2020-01-01T00:00:00Z",
    description: "A tool",
    stargazers_count: 1200,
    forks_count: 30,
    language: "Rust",
    topics: ["cli"],
    open_issues_count: 8,
    has_issues: true,
    archived: false,
    private: false,
    ...overrides,
  };
}

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
      return Response.json({ items: [restRepository()] });
    };
    const first = new GitHubApiClient(transport);
    const second = new GitHubApiClient(async () =>
      Response.json({ items: [restRepository({ id: 84 })] }),
    );
    const [firstRepository] = await first.searchRepositories(
      "typescript",
      "beginner",
      "first-token",
      5,
    );
    const [secondRepository] = await second.searchRepositories("rust", "expert", "second-token");
    assert.equal(firstRepository.id, 42);
    assert.equal(secondRepository.id, 84);
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

  test("normalizes repository search results like issue search repositories", async ({
    assert,
  }) => {
    const client = new GitHubApiClient(async () => Response.json({ items: [restRepository()] }));
    assert.deepEqual(await client.searchRepositories("rust", "beginner", "token"), [
      {
        id: 42,
        name: "tool",
        ownerLogin: "acme",
        ownerAvatarUrl: "https://avatars.githubusercontent.com/u/9",
        url: "https://github.com/acme/tool",
        description: "A tool",
        stars: 1200,
        forksCount: 30,
        openIssuesCount: 8,
        language: "Rust",
        topics: ["cli"],
        homepageUrl: null,
        license: "Other",
        pushedAt: "2026-10-02T00:00:00Z",
        createdAt: "2020-01-01T00:00:00Z",
        isArchived: false,
        isPrivate: false,
        hasIssues: true,
      },
    ]);
  });

  test("keeps a real SPDX identifier and an absent licence", async ({ assert }) => {
    const client = new GitHubApiClient(async () =>
      Response.json({
        items: [
          restRepository({ license: { spdx_id: "MIT", name: "MIT License" } }),
          restRepository({ id: 43, license: null, homepage: "https://tool.dev" }),
        ],
      }),
    );
    const repositories = await client.searchRepositories("rust", "beginner", "token");
    assert.deepEqual(
      repositories.map((repository) => [repository.license, repository.homepageUrl]),
      [
        ["MIT", null],
        [null, "https://tool.dev"],
      ],
    );
  });

  test("rejects repository search items without an identity", async ({ assert }) => {
    const client = new GitHubApiClient(async () => Response.json({ items: [{ id: 42 }] }));
    const error = await client.searchRepositories("rust", "beginner", "token").catch((e) => e);
    assert.instanceOf(error, GitHubInvalidResponseError);
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
});
