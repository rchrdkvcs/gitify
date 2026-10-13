import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { ulid } from "ulid";
import type { GitHubRepository } from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";

export type RepositoryIdentityImport = {
  searchLanguage: string;
  legacyDifficulty: Difficulty;
  topics: "refresh" | "keep";
};

const metadataColumns = [
  "owner_name",
  "name",
  "description",
  "repository_url",
  "stars",
  "forks_count",
  "open_issues_count",
  "language",
  "owner_avatar_url",
  "homepage_url",
  "license",
  "pushed_at",
  "github_created_at",
  "updated_at",
];

export async function upsertRepositories(
  repositories: GitHubRepository[],
  { searchLanguage, legacyDifficulty, topics }: RepositoryIdentityImport,
  trx: TransactionClientContract,
): Promise<Map<number, string>> {
  const unique = new Map(repositories.map((repository) => [repository.id, repository]));
  if (unique.size === 0) {
    return new Map();
  }
  const now = new Date();
  const rows = [...unique.values()]
    .sort((a, b) => a.id - b.id)
    .map((repository) => ({
      id: ulid(),
      github_repo_id: repository.id,
      ...repositoryMetadata(repository, searchLanguage),
      topics: JSON.stringify(repository.topics),
      difficulty: legacyDifficulty,
      created_at: now,
      updated_at: now,
    }));
  const stored: { id: string; github_repo_id: string | number }[] = await trx
    .knexQuery()
    .table("projects")
    .insert(rows)
    .onConflict("github_repo_id")
    .merge(topics === "refresh" ? [...metadataColumns, "topics"] : metadataColumns)
    .returning(["id", "github_repo_id"]);
  return new Map(stored.map((project) => [Number(project.github_repo_id), project.id]));
}

function repositoryMetadata(repository: GitHubRepository, searchLanguage: string) {
  return {
    owner_name: repository.ownerLogin,
    name: repository.name,
    description: repository.description,
    repository_url: repository.url,
    stars: repository.stars,
    forks_count: repository.forksCount,
    open_issues_count: repository.openIssuesCount,
    language: repository.language?.toLowerCase() ?? searchLanguage,
    owner_avatar_url: repository.ownerAvatarUrl,
    homepage_url: repository.homepageUrl,
    license: repository.license,
    pushed_at: repository.pushedAt,
    github_created_at: repository.createdAt,
  };
}
