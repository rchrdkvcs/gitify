import type { ApiClient } from "@japa/api-client";
import { GithubDriver } from "@adonisjs/ally/drivers/github";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import User from "#models/user";

type DriverUser = Awaited<ReturnType<GithubDriver["user"]>>;

const original = {
  user: GithubDriver.prototype.user,
  stateMisMatch: GithubDriver.prototype.stateMisMatch,
};

function signInAs(id: number, email: string, verified: boolean) {
  GithubDriver.prototype.stateMisMatch = () => false;
  GithubDriver.prototype.user = async () =>
    ({
      id,
      email,
      name: "Contributor",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      emailVerificationState: verified ? "verified" : "unverified",
      token: { token: "oauth-token" },
      original: { login: "contributor" },
    }) as unknown as DriverUser;
}

function callback(client: ApiClient) {
  return client.get("/auth/github/callback").qs({ code: "oauth-code", state: "s" }).redirects(0);
}

test.group("GitHub OAuth callback failures", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  group.each.teardown(() => {
    GithubDriver.prototype.user = original.user;
    GithubDriver.prototype.stateMisMatch = original.stateMisMatch;
  });

  test("a cancelled login redirects home with a flashed error", async ({ client }) => {
    const response = await client
      .get("/auth/github/callback")
      .qs({ error: "access_denied" })
      .redirects(0);
    response.assertStatus(302);
    response.assertHeader("location", "/");
    response.assertFlashMessage("error", "Connexion GitHub annulée.");
  });

  test("an expired login state redirects home with a flashed error", async ({ client }) => {
    const response = await callback(client);
    response.assertStatus(302);
    response.assertHeader("location", "/");
    response.assertFlashMessage(
      "error",
      "Ta session de connexion a expiré. Réessaie de te connecter.",
    );
  });

  test("a login without verified email redirects home with a flashed error", async ({
    client,
    assert,
  }) => {
    signInAs(901, "unverified@example.com", false);
    const response = await callback(client);
    response.assertStatus(302);
    response.assertHeader("location", "/");
    response.assertFlashMessage(
      "error",
      "Un email vérifié sur GitHub est nécessaire pour créer ou lier ton compte.",
    );
    assert.isNull(await User.findBy("email", "unverified@example.com"));
  });

  test("an email owned by another identity redirects home with a flashed error", async ({
    client,
  }) => {
    await User.create({ email: "taken@example.com", githubUserId: "111", isVerified: true });
    signInAs(902, "taken@example.com", true);
    const response = await callback(client);
    response.assertStatus(302);
    response.assertHeader("location", "/");
    response.assertFlashMessage("error", "Cet email est déjà associé à un autre compte GitHub.");
  });

  test("the flashed error reaches the next Inertia page", async ({ client, assert }) => {
    const response = await client
      .get("/")
      .withInertia()
      .withFlashMessages({ error: "Connexion GitHub annulée." });
    response.assertStatus(200);
    assert.deepEqual(response.body().flash, { error: "Connexion GitHub annulée." });
  });
});
