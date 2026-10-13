import app from "@adonisjs/core/services/app";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import User from "#models/user";
import { GitHubAdapter } from "#services/github/github_adapter";
import { GitHubAuthError } from "#services/github/github_errors";
import { backgroundRefreshes } from "#services/search_freshness/background_refreshes";
import { FakeGitHubAdapter, githubRepository } from "#tests/helpers/fake_github_adapter";
import { restoreGitHub, swapGitHub } from "#tests/helpers/github_container";

const explore = "/explore?language=typescript&level=beginner";

function reader(githubAccessToken: string | null) {
  return User.create({ email: "reader@example.com", name: "Reader", githubAccessToken });
}

async function cachedProject() {
  const project = await Project.create({
    githubRepoId: 7,
    name: "cached-project",
    ownerName: "gitify",
    repositoryUrl: "https://github.com/gitify/cached-project",
    language: "typescript",
    difficulty: "beginner",
  });
  await ProjectSearchMembership.create({
    projectId: project.id,
    language: "typescript",
    difficulty: "beginner",
  });
  return project;
}

function searchTokens(github: FakeGitHubAdapter) {
  return [...new Set(github.searchCalls.map((call) => call.token))];
}

test.group("GitHub reader", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  group.each.teardown(() => restoreGitHub());

  test("the production adapter is unreachable from tests", async ({ assert }) => {
    assert.instanceOf(await app.container.make(GitHubAdapter), FakeGitHubAdapter);
  });

  test("guests read GitHub with the server token", async ({ client, assert }) => {
    const github = swapGitHub({ serverToken: "server-token" });
    github.repos = [githubRepository()];
    const refreshing = await client.get(explore).withInertia();
    refreshing.assertInertiaPropsContains({ projects: { data: [] }, refreshState: "refreshing" });
    await backgroundRefreshes.settled();
    const page = await client.get(explore).withInertia();
    page.assertInertiaPropsContains({
      projects: { data: [{ name: "repo-101" }] },
      refreshState: "ready",
    });
    await client.get("/").withInertia();
    await backgroundRefreshes.settled();
    assert.deepEqual(searchTokens(github), ["server-token"]);
  });

  test("signed-in users read GitHub with their own token", async ({ client, assert }) => {
    const github = swapGitHub({ serverToken: "server-token" });
    const user = await reader("user-token");
    await client.get(explore).loginAs(user).withInertia();
    await client.get("/issues?label=help-wanted&language=go").loginAs(user).withInertia();
    await backgroundRefreshes.settled();
    assert.deepEqual(searchTokens(github), ["user-token"]);
    assert.deepEqual(
      github.issueSearchCalls.map((call) => call.token),
      ["user-token"],
    );
  });

  test("a revoked user token falls back to the server token", async ({ client, assert }) => {
    const github = swapGitHub({ serverToken: "server-token" });
    github.repos = [githubRepository()];
    github.tokenErrors.set("revoked-token", new GitHubAuthError(401, "Unauthorized"));
    const user = await reader("revoked-token");
    await client.get(explore).loginAs(user).withInertia();
    await backgroundRefreshes.settled();
    const page = await client.get(explore).loginAs(user).withInertia();
    page.assertInertiaPropsContains({
      projects: { data: [{ name: "repo-101" }] },
      refreshState: "ready",
    });
    assert.deepEqual(
      github.searchCalls.map((call) => call.token),
      ["revoked-token", "server-token"],
    );
  });

  test("without a server token guests only see cached data", async ({ client, assert }) => {
    const github = swapGitHub({ serverToken: null });
    const project = await cachedProject();
    const page = await client.get(explore).withInertia();
    page.assertInertiaPropsContains({
      projects: { data: [{ id: project.id }] },
      refreshState: "ready",
    });
    await client.get("/").withInertia();
    await client.get("/issues?language=typescript").withInertia();
    const detail = await client.get(`/projects/${project.ownerName}/${project.name}`).withInertia();
    detail.assertStatus(200);
    assert.isEmpty(github.searchCalls);
    assert.isEmpty(github.issueSearchCalls);
    assert.isEmpty(github.snapshotCalls);
  });
});
