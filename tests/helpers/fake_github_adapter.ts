import type { GitHubAdapter, GitHubRepo, ProjectDetails } from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";

export function githubRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 101,
    owner: { login: "owner" },
    name: "repo-101",
    html_url: "https://github.com/owner/repo-101",
    description: null,
    stargazers_count: 5,
    forks_count: 1,
    language: "TypeScript",
    topics: [],
    has_issues: true,
    open_issues_count: 1,
    ...overrides,
  };
}

export class FakeGitHubAdapter implements GitHubAdapter {
  searchCalls: { language: string; difficulty: Difficulty; token: string; perPage?: number }[] = [];
  detailsCalls: { ownerName: string; repoName: string; token: string }[] = [];
  repos: GitHubRepo[] = [];
  details: ProjectDetails = {
    readme: null,
    languages: null,
    contributors: [],
    latestRelease: null,
    totalContributorsCount: 0,
  };
  searchError?: Error;
  detailsError?: Error;

  async searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage?: number,
  ) {
    this.searchCalls.push({ language, difficulty, token, perPage });
    if (this.searchError) {
      throw this.searchError;
    }
    return this.repos;
  }

  async getProjectDetails(ownerName: string, repoName: string, token: string) {
    this.detailsCalls.push({ ownerName, repoName, token });
    if (this.detailsError) {
      throw this.detailsError;
    }
    return this.details;
  }
}
