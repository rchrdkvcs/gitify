import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import { upgradeStoredPreferences } from "#database/migrations/1791800000007_add_onboarding_to_users";
import User from "#models/user";
import GitHubCredentials from "#services/github/github_credentials";
import OnboardingService from "#services/onboarding_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

const json = { accept: "application/json" };

async function newUser(overrides: Partial<User> = {}) {
  return User.create({
    email: "onboarding@example.com",
    name: "Newcomer",
    githubAccessToken: "user-token",
    ...overrides,
  });
}

test.group("Onboarding", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("login lands on the onboarding until it is finished or skipped", async ({ assert }) => {
    const service = new OnboardingService(new FakeGitHubAdapter());
    assert.equal(
      service.landingPath({ onboardedAt: null, onboardingSkippedAt: null }),
      "/onboarding",
    );
    assert.equal(
      service.landingPath({ onboardedAt: null, onboardingSkippedAt: DateTime.now() }),
      "/explore",
    );
    assert.equal(
      service.landingPath({ onboardedAt: DateTime.now(), onboardingSkippedAt: null }),
      "/explore",
    );
  });

  test("guests cannot open the onboarding", async ({ client }) => {
    const response = await client.get("/onboarding").redirects(0);
    response.assertStatus(302);
    response.assertHeader("location", "/");
  });

  test("renders the first question with deferred language suggestions", async ({
    client,
    assert,
  }) => {
    const user = await newUser();
    const page = await client.get("/onboarding").loginAs(user).withInertia();
    page.assertStatus(200);
    page.assertInertiaComponent("onboarding");
    page.assertInertiaPropsContains({ initialStep: 1, user: { onboardedAt: null } });
    assert.notProperty(page.inertiaProps, "suggestedLanguages");
    assert.include(JSON.stringify(page.body()), "suggestedLanguages");
  });

  test("saves each answer, resumes after a skip and completes", async ({ client, assert }) => {
    const user = await newUser();

    const first = await client
      .patch("/api/onboarding")
      .loginAs(user)
      .withCsrfToken()
      .headers(json)
      .json({ step: 1, level: "some_contributions" });
    first.assertStatus(200);
    first.assertBody({ step: 1 });

    const second = await client
      .patch("/api/onboarding")
      .loginAs(user)
      .withCsrfToken()
      .headers(json)
      .json({ step: 2, contributionTypes: ["Documentation", "translation"] });
    second.assertStatus(200);

    const invalid = await client
      .patch("/api/onboarding")
      .loginAs(user)
      .withCsrfToken()
      .headers(json)
      .json({ step: 3, languages: ["klingon"] });
    invalid.assertStatus(422);

    const mismatched = await client
      .patch("/api/onboarding")
      .loginAs(user)
      .withCsrfToken()
      .headers(json)
      .json({ step: 4, level: "experienced" });
    mismatched.assertStatus(422);

    await user.refresh();
    assert.deepEqual(user.preferences, {
      level: "some_contributions",
      languages: [],
      contributionTypes: ["documentation", "translation"],
      topics: [],
    });
    assert.equal(user.onboardingStep, 2);

    const skipped = await client
      .post("/onboarding/skip")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0);
    skipped.assertStatus(302);
    skipped.assertHeader("location", "/explore");
    await user.refresh();
    assert.isNotNull(user.onboardingSkippedAt);
    assert.equal(new OnboardingService(new FakeGitHubAdapter()).landingPath(user), "/explore");

    const resumed = await client.get("/onboarding").loginAs(user).withInertia();
    resumed.assertInertiaPropsContains({ initialStep: 3 });

    const completed = await client
      .put("/onboarding")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0)
      .json({
        level: "some_contributions",
        languages: ["elixir"],
        contributionTypes: ["documentation"],
        topics: ["education"],
      });
    completed.assertStatus(303);
    completed.assertHeader("location", "/onboarding");
    await user.refresh();
    assert.isNotNull(user.onboardedAt);
    assert.equal(user.onboardingStep, 4);
    assert.deepEqual(user.preferences?.languages, ["elixir"]);

    const review = await client.get("/onboarding").loginAs(user).withInertia();
    review.assertInertiaPropsContains({ initialStep: 1 });
  });

  test("suggests languages from the user's GitHub repositories", async ({ assert }) => {
    const github = new FakeGitHubAdapter();
    github.userRepositoryLanguages = ["Rust", "Go", "Rust", null, "Brainfuck"];
    const service = new OnboardingService(github);
    const credentials = new GitHubCredentials("server-token");
    const user = await newUser();

    assert.deepEqual(await service.suggestLanguages(user, credentials.readerFor(user)), [
      "rust",
      "go",
    ]);
    assert.deepEqual(github.userRepositoryCalls, ["user-token"]);

    const tokenless = await newUser({ email: "tokenless@example.com", githubAccessToken: null });
    assert.deepEqual(
      await service.suggestLanguages(tokenless, credentials.readerFor(tokenless)),
      [],
    );
    assert.deepEqual(github.userRepositoryCalls, ["user-token"]);

    await service.saveAnswer(user, { step: 3, languages: ["python"] });
    assert.deepEqual(await service.suggestLanguages(user, credentials.readerFor(user)), []);
    const failing = new FakeGitHubAdapter();
    failing.userRepositoriesError = new Error("GitHub down");
    const other = await newUser({ email: "other@example.com" });
    assert.deepEqual(
      await new OnboardingService(failing).suggestLanguages(other, credentials.readerFor(other)),
      [],
    );
  });

  test("migrates legacy binary preferences to the new levels", async ({ assert }) => {
    const ids: string[] = [];
    for (const [email, preferences] of [
      ["beginner@example.com", { difficulty: "beginner", languages: ["TypeScript", "cobol"] }],
      ["expert@example.com", { difficulty: "expert", languages: ["rust"] }],
    ] as const) {
      const user = await newUser({ email });
      ids.push(user.id);
      await db
        .from("users")
        .where("id", user.id)
        .update({ preferences: JSON.stringify(preferences) });
    }

    const before = await User.findOrFail(ids[1]);
    assert.equal(before.preferences?.level, "experienced");

    await upgradeStoredPreferences(db.connection());
    const rows = await db.from("users").whereIn("id", ids).orderBy("email").select("preferences");
    assert.deepEqual(
      rows.map((row) => row.preferences),
      [
        {
          level: "first_contribution",
          languages: ["typescript"],
          contributionTypes: ["code"],
          topics: [],
        },
        { level: "experienced", languages: ["rust"], contributionTypes: ["code"], topics: [] },
      ],
    );
  });

  test("preferences set the catalogue defaults", async ({ client, assert }) => {
    const user = await newUser({
      preferences: {
        level: "first_contribution",
        languages: ["rust"],
        contributionTypes: ["code"],
        topics: ["cli"],
      },
    });
    const page = await client.get("/explore").loginAs(user).withInertia();
    page.assertStatus(200);
    assert.deepEqual(page.inertiaProps.filters, {
      q: "",
      topic: null,
      languages: ["rust"],
      level: "beginner",
      sort: "welcome",
      minScore: null,
    });
    assert.equal(page.inertiaProps.topicOptions[0], "cli");
    assert.deepEqual(page.inertiaProps.preferredTopics, ["cli"]);

    const explicit = await client.get("/explore?sort=recent&score=60").loginAs(user).withInertia();
    assert.equal(explicit.inertiaProps.filters.sort, "recent");
    assert.equal(explicit.inertiaProps.filters.minScore, 60);
    assert.equal(explicit.inertiaProps.filters.level, "beginner");
    assert.deepEqual(explicit.inertiaProps.filters.languages, ["rust"]);

    const cleared = await client.get("/explore?language=&level=all").loginAs(user).withInertia();
    assert.deepEqual(cleared.inertiaProps.filters.languages, []);
    assert.equal(cleared.inertiaProps.filters.level, "all");
  });
});
