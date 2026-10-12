import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import User from "#models/user";

test.group("User preference updates", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("saves canonical unique choices visible in the user profile", async ({ client }) => {
    const user = await User.create({ email: "preferences@example.com", name: "Contributor" });
    const saved = await client
      .put("/auth/preferences")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0)
      .json({ difficulty: "expert", languages: [" TypeScript ", "RUST", "typescript", "rust"] });
    saved.assertStatus(303);
    saved.assertHeader("location", "/explore");

    const profile = await client.get("/profil").loginAs(user).withInertia();
    profile.assertStatus(200);
    profile.assertInertiaPropsContains({
      user: { preferences: { difficulty: "expert", languages: ["typescript", "rust"] } },
    });
  });

  test("invalid choices leave existing preferences unchanged", async ({ client }) => {
    const preferences = { difficulty: "beginner" as const, languages: ["python"] };
    const user = await User.create({
      email: "preferences@example.com",
      name: "Contributor",
      preferences,
    });

    for (const languages of [
      ["   "],
      ["unsupported"],
      [],
      Array.from({ length: 14 }, () => "rust"),
    ]) {
      const rejected = await client
        .put("/auth/preferences")
        .loginAs(user)
        .withCsrfToken()
        .withInertia()
        .header("referer", "/preferences")
        .redirects(0)
        .json({ difficulty: "expert", languages });
      rejected.assertStatus(303);
      rejected.assertHeader("location", "/preferences");
      rejected.assertFlashMessage("inputErrorsBag");

      const profile = await client.get("/profil").loginAs(user).withInertia();
      profile.assertStatus(200);
      profile.assertInertiaPropsContains({ user: { preferences } });
    }
  });
});
