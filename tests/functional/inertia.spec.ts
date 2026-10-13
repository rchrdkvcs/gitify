import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import UserProjectFavorite from "#models/user_project_favorite";
import { githubRepository } from "#tests/helpers/fake_github_adapter";
import { restoreGitHub, swapGitHub } from "#tests/helpers/github_container";
import { createProject, createUser } from "#tests/helpers/inertia_fixtures";

test.group("Inertia application", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  group.each.teardown(() => restoreGitHub());

  test("serves the initial HTML document from AdonisJS", async ({ client }) => {
    const response = await client.get("/");
    response.assertStatus(200);
    response.assertHeader("content-type", "text/html; charset=utf-8");
    response.assertTextIncludes('lang="fr"');
    response.assertTextIncludes('id="app"');
  });

  test("renders the public showcase with initial props", async ({ client }) => {
    await createProject();
    const response = await client.get("/").withInertia();
    response.assertStatus(200);
    response.assertInertiaComponent("index");
    response.assertInertiaPropsContains({
      user: null,
      languages: [{ language: "typescript", projects: [{ name: "test-project" }] }],
    });
  });

  test("redirects guests from protected pages", async ({ client }) => {
    for (const url of ["/favorites", "/profil", "/preferences"]) {
      const response = await client.get(url).redirects(0);
      response.assertStatus(302);
      response.assertHeader("location", "/");
    }
  });

  test("filters the public catalogue by search text and level", async ({ client, assert }) => {
    const project = await createProject();
    const match = await client
      .get(`/explore?q=${project.name.slice(0, 6)}&level=all`)
      .withInertia();
    match.assertStatus(200);
    assert.deepEqual(
      match.inertiaProps.projects.data.map((item: { id: string }) => item.id),
      [project.id],
    );
    assert.equal(match.inertiaProps.filters.level, "all");

    const miss = await client.get("/explore?q=%25_no_such_project&level=all").withInertia();
    assert.lengthOf(miss.inertiaProps.projects.data, 0);

    project.topics = ["cli", "terminal"];
    await project.save();
    const topic = await client.get("/explore?topic=cli&level=all").withInertia();
    assert.lengthOf(topic.inertiaProps.projects.data, 1);
    assert.includeMembers(topic.inertiaProps.topicOptions, ["cli", "terminal"]);
    const otherTopic = await client.get("/explore?topic=web&level=all").withInertia();
    assert.lengthOf(otherTopic.inertiaProps.projects.data, 0);

    const expert = await client.get("/explore?level=expert").withInertia();
    assert.lengthOf(expert.inertiaProps.projects.data, 0);
  });

  test("shares public user data without exposing the GitHub token", async ({ client, assert }) => {
    const user = await createUser();
    const response = await client.get("/profil").loginAs(user).withInertia();
    response.assertStatus(200);
    response.assertInertiaComponent("profil");
    response.assertInertiaPropsContains({
      user: { id: user.id, name: user.name, preferences: user.preferences },
    });
    assert.notProperty(response.inertiaProps.user, "githubAccessToken");
    assert.notInclude(JSON.stringify(response.body()), "private-test-token");
  });

  test("lets guests browse the catalogue and project pages", async ({ client }) => {
    const project = await createProject();
    const list = await client.get("/explore").withInertia();
    list.assertStatus(200);
    list.assertInertiaPropsContains({
      projects: { data: [{ id: project.id, isFavorite: false }] },
    });

    const detail = await client
      .get(`/projects/${project.ownerName.toUpperCase()}/${project.name}`)
      .withInertia();
    detail.assertStatus(200);
    detail.assertInertiaComponent("projects/show");
    detail.assertInertiaPropsContains({ project: { id: project.id, isFavorite: false } });

    const missing = await client.get(`/projects/${project.ownerName}/unknown-repo`);
    missing.assertStatus(404);
  });

  test("renders the personalized feed refreshed with the reader's token", async ({
    client,
    assert,
  }) => {
    const user = await createUser();
    const project = await createProject();
    const github = swapGitHub();
    github.repos = [githubRepository({ id: 42, name: "test-project", ownerLogin: "gitify" })];
    const response = await client.get("/explore").loginAs(user).withInertia();
    response.assertStatus(200);
    response.assertInertiaPropsContains({
      projects: { data: [{ id: project.id, isFavorite: false }] },
    });
    assert.deepEqual(
      github.searchCalls.map((call) => call.token),
      ["private-test-token"],
    );
  });

  test("renders project details and favorite state", async ({ client }) => {
    const user = await createUser();
    const project = await createProject();
    await UserProjectFavorite.create({ userId: user.id, projectId: project.id });
    const response = await client
      .get(`/projects/${project.ownerName}/${project.name}`)
      .loginAs(user)
      .withInertia();
    response.assertStatus(200);
    response.assertInertiaComponent("projects/show");
    response.assertInertiaPropsContains({
      project: { id: project.id, readme: "# Test project", isFavorite: true },
    });
  });

  test("renders paginated favorites", async ({ client }) => {
    const user = await createUser();
    const project = await createProject();
    await UserProjectFavorite.create({ userId: user.id, projectId: project.id });
    const response = await client.get("/favorites?page=1").loginAs(user).withInertia();
    response.assertStatus(200);
    response.assertInertiaComponent("favorites");
    response.assertInertiaPropsContains({
      projects: [{ id: project.id, isFavorite: true }],
      meta: { currentPage: 1 },
    });
  });
});
