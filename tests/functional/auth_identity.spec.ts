import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import Project from "#models/project";
import User from "#models/user";
import UserProjectFavorite from "#models/user_project_favorite";
import AuthService from "#services/auth_service";

function githubUser(email: string, id: unknown = "123", verified = true) {
  return {
    id,
    email,
    name: "Contributor",
    avatarUrl: "https://avatars.githubusercontent.com/u/123",
    emailVerificationState: verified ? ("verified" as const) : ("unverified" as const),
    token: { token: "updated-token" },
    original: { login: "contributor" },
  };
}

test.group("GitHub account identity", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("accepts the numeric ID returned by the real Ally GitHub driver", async ({ assert }) => {
    const numeric = await AuthService.findOrCreateFromGitHub(
      githubUser("numeric@example.com", 123),
    );
    const canonical = await AuthService.findOrCreateFromGitHub(
      githubUser("numeric@example.com", "00123"),
    );
    assert.equal(numeric.githubUserId, "123");
    assert.equal(canonical.id, numeric.id);
  });

  test("an unverified first login cannot reserve another user's email", async ({ assert }) => {
    await assert.rejects(() =>
      AuthService.findOrCreateFromGitHub(githubUser("victim@example.com", "456", false)),
    );
    assert.isNull(await User.findBy("email", "victim@example.com"));
    const verified = await AuthService.findOrCreateFromGitHub(
      githubUser("victim@example.com", "123"),
    );
    assert.equal(verified.githubUserId, "123");
  });

  test("preserves account, preferences and favorites when verified email changes", async ({
    assert,
  }) => {
    const original = await AuthService.findOrCreateFromGitHub(githubUser("old@example.com"));
    original.preferences = { difficulty: "expert", languages: ["rust"] };
    await original.save();
    const project = await Project.create({
      githubRepoId: 9191,
      name: "identity-test",
      ownerName: "gitify",
      repositoryUrl: "https://github.com/gitify/identity-test",
      language: "rust",
      difficulty: "expert",
    });
    await UserProjectFavorite.create({ userId: original.id, projectId: project.id });

    const returned = await AuthService.findOrCreateFromGitHub(githubUser("new@example.com"));
    assert.equal(returned.id, original.id);
    assert.equal(returned.email, "new@example.com");
    assert.deepEqual(returned.preferences, { difficulty: "expert", languages: ["rust"] });
    assert.exists(await UserProjectFavorite.findBy("userId", returned.id));
    assert.lengthOf(await User.all(), 1);
  });

  test("links a legacy account through its verified email, keeping its data", async ({
    assert,
  }) => {
    const legacy = await User.create({
      email: "Legacy@example.com",
      isVerified: false,
      githubAccessToken: "dead-legacy-token",
      preferences: { difficulty: "beginner", languages: ["typescript"] },
    });
    const project = await Project.create({
      githubRepoId: 9192,
      name: "legacy-identity-test",
      ownerName: "gitify",
      repositoryUrl: "https://github.com/gitify/legacy-identity-test",
      language: "rust",
      difficulty: "expert",
    });
    await UserProjectFavorite.create({ userId: legacy.id, projectId: project.id });

    const linked = await AuthService.findOrCreateFromGitHub(githubUser("legacy@example.com"));
    assert.equal(linked.id, legacy.id);
    assert.equal(linked.githubUserId, "123");
    assert.isTrue(linked.isVerified);
    assert.equal(linked.githubAccessToken, "updated-token");
    assert.deepEqual(linked.preferences, legacy.preferences);
    assert.exists(await UserProjectFavorite.findBy("userId", linked.id));
    assert.lengthOf(await User.all(), 1);
  });

  test("an unverified login cannot link a legacy account", async ({ assert }) => {
    const legacy = await User.create({ email: "unclaimed@example.com", isVerified: true });
    await assert.rejects(() =>
      AuthService.findOrCreateFromGitHub(githubUser(legacy.email, "123", false)),
    );
    await legacy.refresh();
    assert.isNull(legacy.githubUserId);
  });

  test("an email collision keeps the stored email of an identified user", async ({ assert }) => {
    const original = await AuthService.findOrCreateFromGitHub(githubUser("kept@example.com"));
    await User.create({ email: "stale@example.com", isVerified: false });
    const returned = await AuthService.findOrCreateFromGitHub({
      ...githubUser("stale@example.com"),
      name: "Renamed",
    });
    assert.equal(returned.id, original.id);
    assert.equal(returned.email, "kept@example.com");
    assert.equal(returned.name, "Renamed");
    assert.lengthOf(await User.all(), 2);
  });

  test("rejects malformed identities before creating an account", async ({ assert }) => {
    for (const id of [
      undefined,
      null,
      {},
      "",
      "0",
      "-1",
      "123abc",
      0,
      -1,
      1.2,
      Number.NaN,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      await assert.rejects(() =>
        AuthService.findOrCreateFromGitHub({ ...githubUser("invalid@example.com"), id }),
      );
    }
    assert.isNull(await User.findBy("email", "invalid@example.com"));
  });

  test("never merges distinct GitHub identities with the same email", async ({ assert }) => {
    const original = await AuthService.findOrCreateFromGitHub(githubUser("same@example.com"));
    const error = await AuthService.findOrCreateFromGitHub(githubUser(original.email, "456")).catch(
      (reason) => reason,
    );
    assert.equal(error.status, 409);
    await original.refresh();
    assert.equal(original.githubUserId, "123");
    assert.lengthOf(await User.all(), 1);
  });

  test("unverified email changes keep the proven email and account", async ({ assert }) => {
    const original = await AuthService.findOrCreateFromGitHub(githubUser("proven@example.com"));
    const returned = await AuthService.findOrCreateFromGitHub(
      githubUser("unverified@example.com", "123", false),
    );
    assert.equal(returned.id, original.id);
    assert.equal(returned.email, "proven@example.com");
    assert.isTrue(returned.isVerified);
  });
});

// These tests intentionally use real independent transactions. A global test
// transaction would turn concurrent requests into savepoints on one connection.
test.group("Concurrent GitHub authentication", () => {
  test("concurrent first logins resolve to one account", async ({ assert }) => {
    const id = "1000000000991";
    try {
      const accounts = await Promise.all(
        Array.from({ length: 5 }, () =>
          AuthService.findOrCreateFromGitHub(githubUser("auth-concurrent-991@example.com", id)),
        ),
      );
      assert.lengthOf(new Set(accounts.map((account) => account.id)), 1);
      assert.lengthOf(await User.query().where("githubUserId", id), 1);
    } finally {
      await User.query().where("githubUserId", id).delete();
    }
  });

  test("crossed email changes keep stored emails without deadlocking or merging", async ({
    assert,
  }) => {
    const ids = ["1000000000992", "1000000000993"];
    try {
      const first = await AuthService.findOrCreateFromGitHub(
        githubUser("auth-crossed-992@example.com", ids[0]),
      );
      const second = await AuthService.findOrCreateFromGitHub(
        githubUser("auth-crossed-993@example.com", ids[1]),
      );
      const results = await Promise.all([
        AuthService.findOrCreateFromGitHub(githubUser(second.email, ids[0])),
        AuthService.findOrCreateFromGitHub(githubUser(first.email, ids[1])),
      ]);
      assert.deepEqual(
        results.map((user) => user.id),
        [first.id, second.id],
      );
      await first.refresh();
      await second.refresh();
      assert.equal(first.email, "auth-crossed-992@example.com");
      assert.equal(second.email, "auth-crossed-993@example.com");
    } finally {
      await User.query().whereIn("githubUserId", ids).delete();
    }
  });
});
