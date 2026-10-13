import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";
import { test } from "@japa/runner";
import Contributor from "#models/contributor";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import ProjectShowcase from "#services/feeds/project_showcase";
import GitHubSyncService from "#services/github/github_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

const projectShowcase = new ProjectShowcase(new GitHubSyncService(new FakeGitHubAdapter()));

test.group("Showcase contributors", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("each showcased project displays its own two highest contributors", async ({ assert }) => {
    const projects = await Promise.all(
      [501, 502].map(async (githubRepoId) => {
        const project = await Project.create({
          githubRepoId,
          ownerName: "showcase-owner",
          name: `showcase-${githubRepoId}`,
          repositoryUrl: `https://github.com/showcase-owner/showcase-${githubRepoId}`,
          language: "TypeScript",
          difficulty: "expert",
          stars: 2000,
          forksCount: 0,
          openIssuesCount: 0,
        });
        await ProjectSearchMembership.create({
          projectId: project.id,
          language: "typescript",
          difficulty: "expert",
        });
        await Contributor.createMany(
          [10, 30, 20].map((contributions, index) => ({
            projectId: project.id,
            githubUserId: githubRepoId * 10 + index,
            login: `${githubRepoId}-${contributions}`,
            contributions,
            avatarUrl: "https://github.com/avatar.png",
            profileUrl: "https://github.com/contributor",
          })),
        );
        return project;
      }),
    );

    const showcase = await projectShowcase.languages();
    const displayed = showcase.find((entry) => entry.language === "typescript")?.projects;
    assert.lengthOf(displayed!, 2);
    for (const project of projects) {
      assert.deepEqual(
        displayed!
          .find((entry) => entry.id === project.id)
          ?.contributors.map((entry) => entry.login),
        [`${project.githubRepoId}-30`, `${project.githubRepoId}-20`],
      );
    }
  });

  test("equal contribution counts use contributor IDs for stable selection", async ({ assert }) => {
    const project = await Project.create({
      githubRepoId: 503,
      ownerName: "showcase-owner",
      name: "showcase-ties",
      repositoryUrl: "https://github.com/showcase-owner/showcase-ties",
      language: "TypeScript",
      difficulty: "expert",
      stars: 2000,
      forksCount: 0,
      openIssuesCount: 0,
    });
    await ProjectSearchMembership.create({
      projectId: project.id,
      language: "typescript",
      difficulty: "expert",
    });
    await db.table("contributors").insert(
      ["contributor-c", "contributor-a", "contributor-b"].map((id, index) => ({
        id,
        project_id: project.id,
        github_user_id: 5030 + index,
        login: id,
        contributions: 20,
        avatar_url: "https://github.com/avatar.png",
        profile_url: "https://github.com/contributor",
      })),
    );

    const showcase = await projectShowcase.languages();
    const displayed = showcase.find((entry) => entry.language === "typescript")?.projects;
    assert.deepEqual(
      displayed?.[0]?.contributors.map((entry) => entry.login),
      ["contributor-a", "contributor-b"],
    );
  });
});
