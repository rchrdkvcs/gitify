import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import type { UserPreferences } from "#shared/types/index";
import User from "#models/user";

test.group("User preference updates", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("saves canonical unique choices visible in the user profile", async ({ client, assert }) => {
    const user = await User.create({ email: "preferences@example.com", name: "Contributor" });
    const saved = await client
      .put("/auth/preferences")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0)
      .json({
        level: "experienced",
        languages: [" TypeScript ", "RUST", "typescript", "zig"],
        contributionTypes: ["code", "tests"],
        topics: ["CLI"],
      });
    saved.assertStatus(303);
    saved.assertHeader("location", "/explore");

    const profile = await client.get("/profil").loginAs(user).withInertia();
    profile.assertStatus(200);
    profile.assertInertiaPropsContains({
      user: {
        preferences: {
          level: "experienced",
          languages: ["typescript", "rust", "zig"],
          contributionTypes: ["code", "tests"],
          topics: ["cli"],
        },
      },
    });
    assert.isString(profile.inertiaProps.user.onboardedAt);
  });

  test("invalid choices leave existing preferences unchanged", async ({ client }) => {
    const preferences: UserPreferences = {
      level: "first_contribution",
      languages: ["python"],
      contributionTypes: ["documentation"],
      topics: [],
    };
    const user = await User.create({
      email: "preferences@example.com",
      name: "Contributor",
      preferences,
    });

    for (const body of [
      { ...preferences, languages: ["unsupported"] },
      { ...preferences, level: "expert" },
      { ...preferences, contributionTypes: ["marketing"] },
      { ...preferences, topics: ["Not valid"] },
      { difficulty: "expert", languages: ["rust"] },
    ]) {
      const rejected = await client
        .put("/auth/preferences")
        .loginAs(user)
        .withCsrfToken()
        .withInertia()
        .header("referer", "/preferences")
        .redirects(0)
        .json(body);
      rejected.assertStatus(303);
      rejected.assertHeader("location", "/preferences");
      rejected.assertFlashMessage("inputErrorsBag");

      const profile = await client.get("/profil").loginAs(user).withInertia();
      profile.assertStatus(200);
      profile.assertInertiaPropsContains({ user: { preferences } });
    }
  });
});
