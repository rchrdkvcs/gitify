import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import gitifyConfig from "#config/gitify";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import { ProjectShowcase } from "#services/feeds/project_showcase";
import { GitHubSyncService } from "#services/github/github_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

function descendingRandom() {
  let next = 1;
  return () => (next -= 0.001);
}

test.group("Showcase selection", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("samples each language pool through the injected randomness", async ({ assert }) => {
    const poolSize = gitifyConfig.showcase.perLanguage + 2;
    for (let index = 0; index < poolSize; index++) {
      const project = await Project.create({
        githubRepoId: 7300 + index,
        ownerName: "showcase",
        name: `stars-${index}`,
        repositoryUrl: `https://github.com/showcase/stars-${index}`,
        difficulty: "expert",
        stars: 1000 - index,
        topics: ["one", "two", "three"],
      });
      await ProjectSearchMembership.create({
        projectId: project.id,
        language: "typescript",
        difficulty: "expert",
      });
    }
    const sync = new GitHubSyncService(new FakeGitHubAdapter());

    const showcase = await new ProjectShowcase(sync, descendingRandom()).languages();

    assert.deepEqual(
      showcase.map((entry) => entry.language),
      ["typescript"],
    );
    const projects = showcase[0].projects;
    assert.deepEqual(
      projects.map((project) => project.name),
      Array.from(
        { length: gitifyConfig.showcase.perLanguage },
        (_, index) => `stars-${poolSize - 1 - index}`,
      ),
    );
    assert.deepEqual(projects[0].topics, ["one", "two"]);
    assert.deepEqual(projects[0].contributors, []);
  });
});
