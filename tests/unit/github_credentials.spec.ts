import { test } from "@japa/runner";
import CredentialFallbackAdapter from "#services/github/credential_fallback_adapter";
import GitHubCredentials from "#services/github/github_credentials";
import {
  GitHubAuthError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "#services/github/github_errors";
import { FakeGitHubAdapter, githubRepository } from "#tests/helpers/fake_github_adapter";

const user = { id: "user-1", githubAccessToken: "user-token" };

function fallbackSetup(serverToken: string | null = "server-token") {
  const github = new FakeGitHubAdapter();
  github.repos = [githubRepository()];
  const adapter = new CredentialFallbackAdapter(github, new GitHubCredentials(serverToken));
  const tokens = () => github.searchCalls.map((call) => call.token);
  return { github, adapter, tokens };
}

test.group("GitHub credentials", () => {
  test("a signed-in user reads with their own token", ({ assert }) => {
    assert.deepEqual(new GitHubCredentials("server-token").readerFor(user), {
      userId: "user-1",
      token: "user-token",
      source: "user",
    });
  });

  test("guests and tokenless users read with the server token", ({ assert }) => {
    const credentials = new GitHubCredentials("server-token");
    assert.deepEqual(credentials.readerFor(undefined), {
      userId: null,
      token: "server-token",
      source: "server",
    });
    assert.deepEqual(credentials.readerFor({ id: "user-2", githubAccessToken: null }), {
      userId: "user-2",
      token: "server-token",
      source: "server",
    });
  });

  test("without a server token guests only read the cache", ({ assert }) => {
    for (const missing of [null, undefined, ""]) {
      assert.deepEqual(new GitHubCredentials(missing).readerFor(null), {
        userId: null,
        token: null,
        source: "none",
      });
    }
  });
});

test.group("Credential fallback adapter", () => {
  test("retries once with the server token after {name}")
    .with([
      { name: "a revoked user token", failure: new GitHubAuthError(401, "Unauthorized") },
      { name: "an exhausted user quota", failure: new GitHubRateLimitError(403, null) },
    ])
    .run(async ({ assert }, { failure }) => {
      const { github, adapter, tokens } = fallbackSetup();
      github.tokenErrors.set("user-token", failure);
      const repositories = await adapter.searchRepositories("typescript", "beginner", "user-token");
      assert.lengthOf(repositories, 1);
      assert.deepEqual(tokens(), ["user-token", "server-token"]);
    });

  test("keeps the failure when the server token itself fails", async ({ assert }) => {
    const { github, adapter, tokens } = fallbackSetup();
    github.searchError = new GitHubAuthError(401);
    await assert.rejects(() => adapter.searchRepositories("go", "expert", "server-token"));
    assert.deepEqual(tokens(), ["server-token"]);
  });

  test("does not retry without a server token or for other failures", async ({ assert }) => {
    const missingServer = fallbackSetup(null);
    missingServer.github.searchError = new GitHubAuthError(401);
    await assert.rejects(() =>
      missingServer.adapter.searchRepositories("go", "expert", "user-token"),
    );
    assert.deepEqual(missingServer.tokens(), ["user-token"]);

    const notFound = fallbackSetup();
    notFound.github.snapshotError = new GitHubNotFoundError(404);
    await assert.rejects(() => notFound.adapter.getRepositorySnapshot("o", "r", "user-token"));
    assert.deepEqual(
      notFound.github.snapshotCalls.map((call) => call.token),
      ["user-token"],
    );
  });

  test("never lists the server account's repositories for a user", async ({ assert }) => {
    const { github, adapter } = fallbackSetup();
    github.tokenErrors.set("user-token", new GitHubAuthError(401));
    await assert.rejects(() => adapter.listUserRepositoryLanguages("user-token"));
    assert.deepEqual(github.userRepositoryCalls, ["user-token"]);
  });
});
