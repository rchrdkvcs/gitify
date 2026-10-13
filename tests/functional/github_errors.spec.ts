import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import Contributor from "#models/contributor";
import Project from "#models/project";
import GitHubApiClient from "#services/github/github_api_client";
import { GitHubUnavailableError } from "#services/github/github_errors";
import GitHubSyncService from "#services/github/github_sync_service";
import { graphqlRepository, restDetailsTransport } from "#tests/helpers/github_payloads";

test.group("GitHub details cache failure", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  for (const failure of ["every endpoint", "/graphql", "/contributors?per_page=30"]) {
    test(`preserves every cached detail and permits retry when ${failure} fails`, async ({
      assert,
    }) => {
      const fetchedAt = DateTime.utc(2026, 1, 1);
      const project = await Project.create({
        githubRepoId: 92001,
        ownerName: "owner",
        name: "failure-test",
        repositoryUrl: "https://github.com/owner/failure-test",
        language: "typescript",
        difficulty: "beginner",
        readme: "# Cached",
        languages: { TypeScript: 10 },
        latestRelease: "v1",
        totalContributorsCount: 1,
        detailsFetchedAt: fetchedAt,
      });
      await Contributor.create({
        projectId: project.id,
        githubUserId: 92002,
        login: "cached",
        avatarUrl: "https://github.com/avatar",
        profileUrl: "https://github.com/cached",
        contributions: 5,
      });
      const unavailable = () => new Response(null, { status: 503 });
      const request: typeof fetch =
        failure === "every endpoint"
          ? async () => unavailable()
          : restDetailsTransport({ [failure]: unavailable });
      const sync = new GitHubSyncService(new GitHubApiClient(request), () =>
        fetchedAt.plus({ days: 10 }),
      );
      const error = await sync.fetchProjectDetails(project, "token").catch((cause) => cause);
      assert.instanceOf(error, GitHubUnavailableError);
      await project.refresh();
      assert.equal(project.readme, "# Cached");
      assert.deepEqual(project.languages, { TypeScript: 10 });
      assert.equal(project.latestRelease, "v1");
      assert.equal(project.totalContributorsCount, 1);
      assert.equal(project.detailsFetchedAt!.toMillis(), fetchedAt.toMillis());
      assert.isTrue(sync.needsDetailsFetch(project));
      const contributors = await Contributor.query().where("projectId", project.id);
      assert.equal(contributors.length, 1);
      assert.equal(contributors[0].login, "cached");
    });
  }

  test("stores expected README and release absence as a successful refresh", async ({ assert }) => {
    const now = DateTime.utc(2026, 1, 10);
    const project = await Project.create({
      githubRepoId: 92003,
      ownerName: "owner",
      name: "absence-test",
      repositoryUrl: "https://github.com/owner/absence-test",
      language: "typescript",
      difficulty: "beginner",
      readme: "# Old",
      latestRelease: "v1",
    });
    const request: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/readme") || url.endsWith("/releases/latest")) {
        return new Response(null, { status: 404 });
      }
      if (url.endsWith("/graphql")) {
        return Response.json(graphqlRepository());
      }
      return Response.json(url.endsWith("/languages") ? {} : []);
    };
    const sync = new GitHubSyncService(new GitHubApiClient(request), () => now);
    await sync.fetchProjectDetails(project, "token");
    await project.refresh();
    assert.isNull(project.readme);
    assert.isNull(project.latestRelease);
    assert.deepEqual(project.languages, {});
    assert.equal(project.totalContributorsCount, 0);
    assert.equal(project.detailsFetchedAt!.toMillis(), now.toMillis());
    assert.isFalse(sync.needsDetailsFetch(project));
  });
});
