import type { Difficulty, RepositoryInsights } from "#shared/types/index";

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  owner: { login: string; avatar_url?: string };
  html_url: string;
  homepage?: string | null;
  license?: { spdx_id: string | null; name: string } | null;
  pushed_at?: string | null;
  created_at?: string | null;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  open_issues_count: number;
  has_issues: boolean;
}

export interface ProjectDetails {
  readme: string | null;
  languages: Record<string, number> | null;
  contributors: GitHubContributor[];
  latestRelease: string | null;
  totalContributorsCount: number;
}

/** Repository metadata that only the detail snapshot keeps current. */
export interface RepositoryInsightsResult {
  insights: RepositoryInsights;
  contributing: string | null;
  metadata: {
    ownerAvatarUrl: string;
    homepageUrl: string | null;
    license: string | null;
    pushedAt: string | null;
    createdAt: string;
    stars: number;
    forksCount: number;
  };
}

export interface GitHubAdapter {
  searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage?: number,
  ): Promise<GitHubRepo[]>;
  getProjectDetails(ownerName: string, repoName: string, token: string): Promise<ProjectDetails>;
  getRepositoryInsights(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<RepositoryInsightsResult>;
}
