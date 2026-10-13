import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import type { Difficulty } from "#shared/types/index";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import { listedProjects, reachableProject } from "#services/feeds/visible_projects";

let nextRepoId = 7100;

async function storedProject(
  name: string,
  memberships: { language: string; difficulty: Difficulty }[],
  isArchived = false,
) {
  const project = await Project.create({
    githubRepoId: nextRepoId++,
    ownerName: "Visible-Owner",
    name,
    repositoryUrl: `https://github.com/visible-owner/${name}`,
    difficulty: "expert",
    isArchived,
  });
  for (const membership of memberships) {
    await ProjectSearchMembership.create({ projectId: project.id, ...membership });
  }
  return project;
}

async function listedNames(languages: string[], level: Difficulty | "all") {
  const projects = await listedProjects({ languages, level }).orderBy("name", "asc");
  return projects.map((project) => project.name);
}

test.group("Visible projects", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("lists repositories still matched by a search and not archived", async ({ assert }) => {
    await storedProject("active", [{ language: "typescript", difficulty: "beginner" }], false);
    await storedProject("unenriched", [{ language: "typescript", difficulty: "expert" }]);
    await storedProject("archived", [{ language: "typescript", difficulty: "beginner" }], true);
    await storedProject("issue-only", []);
    await storedProject("rusty", [{ language: "rust", difficulty: "beginner" }]);

    assert.deepEqual(await listedNames(["TypeScript"], "all"), ["active", "unenriched"]);
    assert.deepEqual(await listedNames(["typescript"], "beginner"), ["active"]);
    assert.deepEqual(await listedNames([], "beginner"), ["active", "rusty"]);
  });

  test("project pages stay reachable outside the listings", async ({ assert }) => {
    const archived = await storedProject("archived", [], true);
    const issueOnly = await storedProject("issue-only", []);

    const foundArchived = await reachableProject("visible-owner", "ARCHIVED");
    const foundIssueOnly = await reachableProject("VISIBLE-OWNER", "issue-only");
    assert.equal(foundArchived?.id, archived.id);
    assert.equal(foundIssueOnly?.id, issueOnly.id);
    assert.isNull(await reachableProject("visible-owner", "missing"));
  });
});
