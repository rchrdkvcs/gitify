import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import gitifyConfig from "#config/gitify";
import Project from "#models/project";
import ProjectDetailReader from "#services/feeds/project_detail";
import { GitHubUnavailableError } from "#services/github/github_errors";
import GitHubSyncService from "#services/github/github_sync_service";
import {
  FakeGitHubAdapter,
  githubContributor,
  repositorySnapshot,
} from "#tests/helpers/fake_github_adapter";
import { restoreGitHub, swapGitHub } from "#tests/helpers/github_container";

const now = DateTime.utc(2026, 10, 1, 12);

class GatedGitHubAdapter extends FakeGitHubAdapter {
  release: () => void = () => {};
  private readonly gate = new Promise<void>((resolve) => {
    this.release = resolve;
  });

  async getRepositorySnapshot(ownerName: string, repoName: string, token: string) {
    await this.gate;
    return super.getRepositorySnapshot(ownerName, repoName, token);
  }
}

function trackedSync(github: FakeGitHubAdapter) {
  const sync = new GitHubSyncService(github, () => now);
  const refreshes: Promise<void>[] = [];
  return {
    refreshes,
    needsDetailsFetch: (project: Project) => sync.needsDetailsFetch(project),
    fetchProjectDetails: (project: Project, token: string) => {
      const refresh = sync.fetchProjectDetails(project, token);
      refreshes.push(refresh);
      return refresh;
    },
  };
}

function freshSnapshot() {
  return repositorySnapshot({ readme: "# Fresh", contributors: [githubContributor(97001)] });
}

async function createProject(attributes: Partial<Project> = {}) {
  return Project.create({
    githubRepoId: 97000,
    ownerName: "owner",
    name: "detail-reader",
    repositoryUrl: "https://github.com/owner/detail-reader",
    language: "typescript",
    difficulty: "beginner",
    ...attributes,
  });
}

const reader = { userId: null, token: "token" };

test.group("Project detail reader", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  group.each.teardown(() => restoreGitHub());

  test("serves stale details immediately and refreshes them in the background", async ({
    assert,
  }) => {
    await createProject({ readme: "# Stale", detailsFetchedAt: now.minus({ hours: 13 }) });
    const github = new GatedGitHubAdapter();
    github.snapshot = freshSnapshot();
    const sync = trackedSync(github);
    const page = await new ProjectDetailReader(sync).read("owner", "detail-reader", reader);
    assert.equal(page?.project.readme, "# Stale");
    assert.isFalse(page?.detailsPending);
    assert.lengthOf(sync.refreshes, 1);
    const served = await page!.details();
    assert.equal(served.readme, "# Stale");
    github.release();
    await Promise.all(sync.refreshes);
    const stored = await Project.findByOrFail("githubRepoId", 97000);
    assert.equal(stored.readme, "# Fresh");
    assert.equal(stored.detailsFetchedAt!.toMillis(), now.toMillis());
  });

  test("defers details that were never fetched to a separate load", async ({ assert }) => {
    await createProject();
    const github = new FakeGitHubAdapter();
    github.snapshot = freshSnapshot();
    const sync = trackedSync(github);
    const page = await new ProjectDetailReader(sync).read("owner", "detail-reader", reader);
    assert.isTrue(page?.detailsPending);
    assert.isNull(page?.project.readme);
    assert.isEmpty(github.snapshotCalls);
    const details = await page!.details();
    assert.equal(details.readme, "# Fresh");
    assert.equal(details.contributors[0].login, "contributor-97001");
    assert.equal(DateTime.fromISO(details.detailsFetchedAt!).toMillis(), now.toMillis());
    assert.lengthOf(github.snapshotCalls, 1);
  });

  test("serves cached data and postpones the next attempt when the deferred load fails", async ({
    assert,
  }) => {
    await createProject();
    const github = new FakeGitHubAdapter();
    github.snapshotError = new GitHubUnavailableError(503);
    const sync = trackedSync(github);
    const detailReader = new ProjectDetailReader(sync);
    const page = await detailReader.read("owner", "detail-reader", reader);
    const details = await page!.details();
    assert.isNull(details.readme);
    assert.isNull(details.detailsFetchedAt);
    const stored = await Project.findByOrFail("githubRepoId", 97000);
    assert.equal(
      stored.detailsRetryAfter!.toMillis(),
      now.plus({ seconds: gitifyConfig.cache.detailsRetrySeconds }).toMillis(),
    );
    const retry = await detailReader.read("owner", "detail-reader", reader);
    assert.isFalse(retry?.detailsPending);
    await retry!.details();
    assert.lengthOf(github.snapshotCalls, 1);
  });

  test("never calls GitHub without a token", async ({ assert }) => {
    await createProject();
    const github = new FakeGitHubAdapter();
    const sync = trackedSync(github);
    const page = await new ProjectDetailReader(sync).read("owner", "detail-reader", {
      userId: null,
      token: null,
    });
    assert.isFalse(page?.detailsPending);
    await page!.details();
    assert.isEmpty(github.snapshotCalls);
  });

  test("the project page delivers missing details as a deferred prop", async ({
    client,
    assert,
  }) => {
    await createProject();
    const github = swapGitHub({ serverToken: "server-token" });
    github.snapshot = freshSnapshot();
    const page = await client.get("/projects/owner/detail-reader").withInertia();
    page.assertStatus(200);
    page.assertInertiaPropsContains({ project: { readme: null }, detailsPending: true });
    assert.notProperty(page.inertiaProps, "details");
    assert.isEmpty(github.snapshotCalls);
    const deferred = await client
      .get("/projects/owner/detail-reader")
      .withInertiaPartialReload("projects/show", ["details" as never]);
    deferred.assertStatus(200);
    deferred.assertInertiaPropsContains({
      details: { readme: "# Fresh", contributors: [{ login: "contributor-97001" }] },
    });
    assert.lengthOf(github.snapshotCalls, 1);
    const fetched = await client.get("/projects/owner/detail-reader").withInertia();
    fetched.assertInertiaPropsContains({ project: { readme: "# Fresh" }, detailsPending: false });
    assert.notProperty(fetched.inertiaProps, "details");
  });
});
