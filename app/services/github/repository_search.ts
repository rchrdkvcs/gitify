import type { GitHubRepository } from "#services/github/github_adapter";
import type { GitHubTransport } from "#services/github/github_transport";
import type { Difficulty } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { GitHubInvalidResponseError } from "#services/github/github_errors";
import { repositorySearchQuery } from "#services/github/github_queries";
import { homepageUrl, licenseName } from "#services/github/repository_fields";

type RestRepository = {
  id: number;
  name: string;
  owner: { login: string; avatar_url?: string | null };
  html_url: string;
  homepage?: string | null;
  license?: { spdx_id: string | null; name: string } | null;
  pushed_at?: string | null;
  created_at?: string | null;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  topics?: string[];
  open_issues_count?: number;
  has_issues?: boolean;
  archived?: boolean;
  private?: boolean;
};

function isRestRepository(item: unknown): item is RestRepository {
  const candidate = item as Partial<RestRepository> | null;
  return (
    typeof candidate?.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.owner?.login === "string" &&
    typeof candidate.html_url === "string"
  );
}

export function repositoryFromRest(repo: RestRepository): GitHubRepository {
  return {
    id: repo.id,
    name: repo.name,
    ownerLogin: repo.owner.login,
    ownerAvatarUrl: repo.owner.avatar_url ?? null,
    url: repo.html_url,
    description: repo.description ?? null,
    stars: repo.stargazers_count ?? 0,
    forksCount: repo.forks_count ?? 0,
    openIssuesCount: repo.open_issues_count ?? 0,
    language: repo.language ?? null,
    topics: repo.topics ?? [],
    homepageUrl: homepageUrl(repo.homepage),
    license: licenseName(repo.license && { spdxId: repo.license.spdx_id, name: repo.license.name }),
    pushedAt: repo.pushed_at ?? null,
    createdAt: repo.created_at ?? null,
    isArchived: repo.archived ?? false,
    isPrivate: repo.private ?? false,
    hasIssues: repo.has_issues ?? false,
  };
}

export async function searchRepositories(
  transport: GitHubTransport,
  request: { language: string; difficulty: Difficulty; token: string; perPage: number },
): Promise<GitHubRepository[]> {
  const query = repositorySearchQuery(request.language, request.difficulty);
  const { data } = await transport.data(
    `${gitifyConfig.github.baseUrl}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${request.perPage}`,
    { token: request.token, accept: gitifyConfig.github.textMatchAcceptHeader },
  );
  const items = (data as { items?: unknown } | null)?.items;
  if (!Array.isArray(items) || !items.every(isRestRepository)) {
    throw new GitHubInvalidResponseError("repositories");
  }
  return items.map(repositoryFromRest);
}
