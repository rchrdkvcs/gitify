import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import type { GitHubRepository } from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";
import Project from "#models/project";

export type RepositoryIdentityImport = {
  searchLanguage: string;
  legacyDifficulty: Difficulty;
  topics: "refresh" | "keep";
};

export async function upsertRepositories(
  repositories: GitHubRepository[],
  { searchLanguage, legacyDifficulty, topics }: RepositoryIdentityImport,
  trx: TransactionClientContract,
): Promise<Map<number, Project>> {
  const unique = new Map(repositories.map((repository) => [repository.id, repository]));
  const projects = new Map<number, Project>();
  for (const repository of [...unique.values()].sort((a, b) => a.id - b.id)) {
    await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtext(?))", [
      `project-identity:${repository.id}`,
    ]);
    const metadata = {
      ...repositoryMetadata(repository, searchLanguage),
      ...(topics === "refresh" ? { topics: repository.topics } : {}),
    };
    const project = await Project.firstOrCreate(
      { githubRepoId: repository.id },
      { ...metadata, topics: repository.topics, difficulty: legacyDifficulty },
      { client: trx },
    );
    project.merge(metadata);
    await project.save();
    projects.set(repository.id, project);
  }
  return projects;
}

function repositoryMetadata(repository: GitHubRepository, searchLanguage: string) {
  return {
    ownerName: repository.ownerLogin,
    name: repository.name,
    description: repository.description,
    repositoryUrl: repository.url,
    stars: repository.stars,
    forksCount: repository.forksCount,
    openIssuesCount: repository.openIssuesCount,
    language: repository.language?.toLowerCase() ?? searchLanguage,
    ownerAvatarUrl: repository.ownerAvatarUrl,
    homepageUrl: repository.homepageUrl,
    license: repository.license,
    pushedAt: repository.pushedAt ? DateTime.fromISO(repository.pushedAt) : null,
    githubCreatedAt: repository.createdAt ? DateTime.fromISO(repository.createdAt) : null,
  };
}
