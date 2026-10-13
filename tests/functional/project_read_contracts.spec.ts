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
import ProjectCatalogue from "#services/feeds/project_catalogue";
import ProjectDetailReader from "#services/feeds/project_detail";
import { addFavorite, favoritePage } from "#services/feeds/project_favorites";
import GitHubSyncService from "#services/github/github_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";
import { feedFor } from "#tests/helpers/feed";

async function fixture() {
  const user = await User.create({
    email: "read-contract@example.com",
    name: "Reader",
    githubAccessToken: "secret",
    preferences: {
      level: "experienced",
      languages: ["typescript"],
      contributionTypes: ["code"],
      topics: [],
    },
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
  const sync = new GitHubSyncService(new FakeGitHubAdapter());
  await addFavorite(user.id, project.id);
  return {
    user,
    other,
    project,
    feed: new ProjectCatalogue(sync),
    detail: new ProjectDetailReader(sync),
  };
}

function assertList(assert: Assert, project: ProjectList) {
  assert.deepEqual(
    Object.keys(project).sort(),
    [
      "id",
      "name",
      "ownerName",
      "ownerAvatarUrl",
      "forksCount",
      "description",
      "repositoryUrl",
      "stars",
      "language",
      "topics",
      "openIssuesCount",
      "difficulty",
      "isFavorite",
      "latestRelease",
      "pushedAt",
      "newcomerScore",
    ].sort(),
  );
  assert.property(project, "pushedAt");
}

test.group("Project public read contracts", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  test("projects reader state and requested feed level without exposing persistence", async ({
    assert,
  }) => {
    const { user, other, project, feed, detail: reader } = await fixture();
    const criteria = { difficulty: "expert" as const, languages: user.preferences!.languages };
    const result = await feedFor(feed, user.id, criteria, "secret");
    assertList(assert, result.projects[0]);
    assert.equal(result.projects[0].difficulty, "expert");
    assert.isTrue(result.projects[0].isFavorite);
    const second = await feedFor(feed, other.id, criteria, "secret");
    assert.isFalse(second.projects[0].isFavorite);
    const page = await reader.read(project.ownerName, project.name, {
      userId: user.id,
      token: "secret",
    });
    assert.isFalse(page?.detailsPending);
    const detail = page?.project;
    assert.equal(detail?.difficulty, "beginner");
    assert.equal(detail?.readme, "# Large detail");
    assert.equal(detail?.contributors[0].login, "contributor");
    assert.isString(detail?.detailsFetchedAt);
    assert.notProperty(detail, "githubRepoId");
    const favorites = await favoritePage(user.id, 1);
    assertList(assert, favorites.projects[0]);
    assert.isTrue(favorites.projects[0].isFavorite);
    assert.equal(favorites.projects[0].difficulty, "beginner");
  });
  test("Inertia pages expose the minimal list projections and feed state", async ({
    client,
    assert,
  }) => {
    const { user, project, feed, detail: reader } = await fixture();
    const page = await client.get("/explore").loginAs(user).withInertia();
    page.assertStatus(200);
    const expected = await feed.explore(
      {
        q: "",
        topic: null,
        languages: user.preferences!.languages,
        level: "expert",
        sort: "stars",
        minScore: null,
      },
      1,
      { userId: user.id, token: "secret" },
    );
    assert.deepEqual(page.inertiaProps.projects.data, expected.projects);
    assert.equal(page.inertiaProps.refreshState, "ready");
    assertList(assert, page.inertiaProps.projects.data[0]);
    const favoritesPage = await client.get("/favorites").loginAs(user).withInertia();
    favoritesPage.assertStatus(200);
    assertList(assert, favoritesPage.inertiaProps.projects[0]);
    assert.deepEqual(
      Object.keys(favoritesPage.inertiaProps.meta).sort(),
      ["total", "perPage", "currentPage", "lastPage"].sort(),
    );
    const detail = await client
      .get(`/projects/${project.ownerName}/${project.name}`)
      .loginAs(user)
      .withInertia();
    detail.assertStatus(200);
    const expectedDetail = await reader.read(project.ownerName, project.name, {
      userId: user.id,
      token: "secret",
    });
    assert.deepEqual(detail.inertiaProps.project, expectedDetail?.project);
    assert.isFalse(detail.inertiaProps.detailsPending);
    assert.notProperty(detail.inertiaProps, "details");
  });
});
