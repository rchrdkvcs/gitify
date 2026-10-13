import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import UserProjectFavorite from "#models/user_project_favorite";
import { createProject, createUser } from "#tests/helpers/inertia_fixtures";

test.group("Inertia mutations", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("saves preferences and redirects through Inertia", async ({ client, assert }) => {
    const user = await createUser(false);
    const response = await client
      .put("/auth/preferences")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0)
      .json({ level: "experienced", languages: ["rust"], contributionTypes: ["code"], topics: [] });
    response.assertStatus(303);
    response.assertHeader("location", "/explore");
    await user.refresh();
    assert.deepEqual(user.preferences, {
      level: "experienced",
      languages: ["rust"],
      contributionTypes: ["code"],
      topics: [],
    });
  });

  test("returns validation errors through the Inertia session", async ({ client }) => {
    const user = await createUser();
    const response = await client
      .put("/auth/preferences")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .header("referer", "/preferences")
      .redirects(0)
      .json({ difficulty: "invalid", languages: [] });
    response.assertStatus(303);
    response.assertHeader("location", "/preferences");
    response.assertFlashMessage("inputErrorsBag");
  });

  test("rejects a favorite mutation without CSRF", async ({ client, assert }) => {
    const user = await createUser();
    const project = await createProject();
    const response = await client
      .post(`/api/projects/${project.id}/favorite`)
      .loginAs(user)
      .header("accept", "application/json")
      .redirects(0);
    response.assertStatus(302);
    response.assertFlashMessage("errorsBag");
    assert.isNull(await UserProjectFavorite.findBy("projectId", project.id));
  });

  test("adds and removes favorites using the shared session", async ({ client, assert }) => {
    const user = await createUser();
    const project = await createProject();
    const added = await client
      .post(`/api/projects/${project.id}/favorite`)
      .loginAs(user)
      .withCsrfToken();
    added.assertStatus(200);
    added.assertBody({ isFavorite: true });
    assert.isNotNull(await UserProjectFavorite.findBy("projectId", project.id));
    const removed = await client
      .delete(`/api/projects/${project.id}/favorite`)
      .loginAs(user)
      .withCsrfToken();
    removed.assertStatus(200);
    removed.assertBody({ isFavorite: false });
    assert.isNull(await UserProjectFavorite.findBy("projectId", project.id));
  });

  test("logs out and redirects to the public home", async ({ client }) => {
    const user = await createUser();
    const response = await client
      .delete("/auth/logout")
      .loginAs(user)
      .withCsrfToken()
      .withInertia()
      .redirects(0);
    response.assertStatus(303);
    response.assertHeader("location", "/");
    response.assertSessionMissing("auth_web");
  });
});
