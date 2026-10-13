import { DateTime } from "luxon";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import User from "#models/user";

export async function createUser(preferences = true) {
  return User.create({
    email: "contributor@example.com",
    name: "Contributor",
    githubAccessToken: "private-test-token",
    preferences: preferences
      ? {
          level: "first_contribution",
          languages: ["typescript"],
          contributionTypes: ["code"],
          topics: [],
        }
      : null,
  });
}

export async function createProject() {
  const project = await Project.create({
    githubRepoId: 42,
    name: "test-project",
    ownerName: "gitify",
    repositoryUrl: "https://github.com/gitify/test-project",
    language: "typescript",
    difficulty: "beginner",
    detailsFetchedAt: DateTime.now(),
    readme: "# Test project",
  });
  await ProjectSearchMembership.create({
    projectId: project.id,
    language: "typescript",
    difficulty: "beginner",
  });
  return project;
}
