import type { ApiClient } from "@japa/api-client";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import Project from "#models/project";
import User from "#models/user";
import UserProjectFavorite from "#models/user_project_favorite";

async function favoriteProjects() {
  const user = await User.create({ email: "favorite-pages@example.com", name: "Contributor" });
  const projects = [];
  const favorites = [];
  for (let index = 0; index < 21; index++) {
    const project = await Project.create({
      githubRepoId: 9000 + index,
      name: `favorite-${index}`,
      ownerName: "gitify",
      repositoryUrl: `https://github.com/gitify/favorite-${index}`,
      language: "typescript",
      difficulty: "beginner",
    });
    const favorite = await UserProjectFavorite.create({
      userId: user.id,
      projectId: project.id,
      createdAt: DateTime.fromISO("2026-01-01T00:00:00Z"),
    });
    projects.push(project);
    favorites.push({ id: favorite.id, projectId: project.id });
  }
  return { user, projects, favorites };
}

async function favoritesPage(client: ApiClient, user: User, page: string | number) {
  const response = await client.get("/favorites").qs({ page }).loginAs(user).withInertia();
  response.assertStatus(200);
  return response.inertiaProps as {
    projects: { id: string }[];
    meta: { total: number; currentPage: number; lastPage: number };
  };
}

test.group("Favorites pagination", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("normalizes invalid pages and clamps requests to a populated last page", async ({
    client,
    assert,
  }) => {
    const { user } = await favoriteProjects();
    for (const [page, expectedPage] of [
      ["invalid", 1],
      ["Infinity", 1],
      ["-Infinity", 1],
      ["NaN", 1],
      ["0", 1],
      ["-5", 1],
      ["1.9", 1],
      ["2.9", 2],
      ["999999999999999999999999999999", 2],
      ["99", 2],
    ] as const) {
      const response = await favoritesPage(client, user, page);
      assert.equal(response.meta.currentPage, expectedPage, `page=${page}`);
      assert.equal(response.meta.lastPage, 2);
      assert.equal(response.projects.length, expectedPage === 1 ? 20 : 1);
    }
  });

  test("equal timestamps have a stable order with no duplicates or omissions across pages", async ({
    client,
    assert,
  }) => {
    const { user, favorites } = await favoriteProjects();
    const first = await favoritesPage(client, user, 1);
    const second = await favoritesPage(client, user, 2);
    const actual = [...first.projects, ...second.projects].map((project) => project.id);
    const expected = favorites
      .sort((left, right) => right.id.localeCompare(left.id))
      .map((favorite) => favorite.projectId);
    assert.deepEqual(actual, expected);
    const repeated = await favoritesPage(client, user, 1);
    assert.deepEqual(
      repeated.projects.map((project) => project.id),
      actual.slice(0, 20),
    );
  });

  test("deleting the last item on page two rereads a full canonical first page", async ({
    client,
    assert,
  }) => {
    const { user } = await favoriteProjects();
    const lastPage = await favoritesPage(client, user, 2);
    const removedId = lastPage.projects[0].id;
    const removed = await client
      .delete(`/api/projects/${removedId}/favorite`)
      .loginAs(user)
      .withCsrfToken();
    removed.assertStatus(200);
    removed.assertBody({ isFavorite: false });

    const response = await favoritesPage(client, user, 2);
    assert.equal(response.meta.currentPage, 1);
    assert.equal(response.meta.lastPage, 1);
    assert.equal(response.meta.total, 20);
    assert.lengthOf(response.projects, 20);
    assert.notInclude(
      response.projects.map((project) => project.id),
      removedId,
    );
  });

  test("an empty user's favorites stays on page one and does not reveal another user's favorites", async ({
    client,
    assert,
  }) => {
    await favoriteProjects();
    const other = await User.create({ email: "no-favorites@example.com", name: "Other" });
    const response = await favoritesPage(client, other, 99);
    assert.isEmpty(response.projects);
    assert.equal(response.meta.currentPage, 1);
    assert.equal(response.meta.total, 0);
  });
});
