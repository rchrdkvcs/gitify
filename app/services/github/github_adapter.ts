import type { Difficulty } from "#shared/types/index";

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
  owner: { login: string };
  html_url: string;
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

export interface GitHubAdapter {
  searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage?: number,
  ): Promise<GitHubRepo[]>;
  getProjectDetails(ownerName: string, repoName: string, token: string): Promise<ProjectDetails>;
}
