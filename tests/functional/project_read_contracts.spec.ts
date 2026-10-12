import type { Assert } from "@japa/assert";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import type { Project as ProjectList } from "#shared/types/index";
import Contributor from "#models/contributor";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import User from "#models/user";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { ProjectFeedService } from "#services/project_feed_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

async function fixture() {
  const user = await User.create({
    email: "read-contract@example.com",
    name: "Reader",
    githubAccessToken: "secret",
    preferences: { difficulty: "expert", languages: ["typescript"] },
  });
  const other = await User.create({ email: "other-read@example.com", name: "Other" });
  const project = await Project.create({
    githubRepoId: 831,
    name: "read-project",
    ownerName: "gitify",
    repositoryUrl: "https://github.com/gitify/read-project",
    difficulty: "beginner",
    language: "typescript",
    readme: "# Large detail",
    languages: { TypeScript: 100 },
    detailsFetchedAt: DateTime.now(),
  });
  for (const difficulty of ["beginner", "expert"] as const) {
    await ProjectSearchMembership.create({
      projectId: project.id,
      language: "typescript",
      difficulty,
    });
    await GithubFetchCache.create({
      language: "typescript",
      difficulty,
      fetchedAt: DateTime.now(),
      totalStored: 1,
    });
  }
  await Contributor.create({
    projectId: project.id,
    login: "contributor",
    avatarUrl: "https://example.com/avatar",
    profileUrl: "https://github.com/contributor",
    contributions: 10,
  });
  const feed = new ProjectFeedService(new GitHubSyncService(new FakeGitHubAdapter()));
  await feed.addFavorite(user.id, project.id);
  return { user, other, project, feed };
}

function assertList(assert: Assert, project: ProjectList) {
  assert.deepEqual(
    Object.keys(project).sort(),
    [
      "id",
      "name",
      "ownerName",
      "description",
      "repositoryUrl",
      "stars",
      "language",
      "topics",
      "openIssuesCount",
      "difficulty",
      "isFavorite",
      "latestRelease",
      "updatedAt",
    ].sort(),
  );
  assert.isString(project.updatedAt);
  assert.isFalse(Number.isNaN(Date.parse(project.updatedAt!)));
}

test.group("Project public read contracts", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  test("projects reader state and requested feed level without exposing persistence", async ({
    assert,
  }) => {
    const { user, other, project, feed } = await fixture();
    const result = await feed.getFeed(user.id, user.preferences!, "secret");
    assertList(assert, result.projects[0]);
    assert.equal(result.projects[0].difficulty, "expert");
    assert.isTrue(result.projects[0].isFavorite);
    const second = await feed.getFeed(other.id, user.preferences!, "secret");
    assert.isFalse(second.projects[0].isFavorite);
    const detail = await feed.getProject(project.id, user.id, "secret");
    assert.equal(detail?.difficulty, "beginner");
    assert.equal(detail?.readme, "# Large detail");
    assert.equal(detail?.contributors[0].login, "contributor");
    assert.isString(detail?.createdAt);
    assert.notProperty(detail, "githubRepoId");
    const favorites = await feed.getFavoriteProjects(user.id, 1);
    assertList(assert, favorites.projects[0]);
    assert.isTrue(favorites.projects[0].isFavorite);
    assert.equal(favorites.projects[0].difficulty, "beginner");
  });
  test("Inertia pages expose the minimal list projections and feed state", async ({
    client,
    assert,
  }) => {
    const { user, project, feed } = await fixture();
    const page = await client.get("/explore").loginAs(user).withInertia();
    page.assertStatus(200);
    const expected = await feed.getFeed(user.id, user.preferences!, "secret");
    assert.deepEqual(page.inertiaProps.projects, expected.projects);
    assert.equal(page.inertiaProps.refreshState, "ready");
    assertList(assert, page.inertiaProps.projects[0]);
    const favoritesPage = await client.get("/favorites").loginAs(user).withInertia();
    favoritesPage.assertStatus(200);
    assertList(assert, favoritesPage.inertiaProps.projects[0]);
    assert.deepEqual(
      Object.keys(favoritesPage.inertiaProps.meta).sort(),
      ["total", "perPage", "currentPage", "lastPage"].sort(),
    );
    const detail = await client.get(`/projects/${project.id}`).loginAs(user).withInertia();
    detail.assertStatus(200);
    assert.deepEqual(
      detail.inertiaProps.project,
      await feed.getProject(project.id, user.id, "secret"),
    );
  });
});
