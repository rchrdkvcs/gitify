import type { Difficulty, IssueKind, RepositoryInsights } from "#shared/types/index";

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

/** Repository fields returned with each issue search result. */
export interface GitHubIssueRepository {
  id: number;
  name: string;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  url: string;
  description: string | null;
  stars: number;
  forksCount: number;
  /** Open issues plus open pull requests, like the REST `open_issues_count`. */
  openIssuesCount: number;
  language: string | null;
  topics: string[];
  homepageUrl: string | null;
  license: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  isArchived: boolean;
  isPrivate: boolean;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  comments: number;
  assignees: number;
  /** Open pull requests that will close the issue (Development sidebar or closing keyword). */
  linkedPullRequests: number;
  labels: { name: string; color: string }[];
  repository: GitHubIssueRepository;
}

export interface GitHubAdapter {
  searchIssues(
    language: string,
    kind: IssueKind,
    token: string,
    perPage?: number,
  ): Promise<GitHubIssue[]>;
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
  /** Primary language of each repository owned by the token's user (forks excluded). */
  listUserRepositoryLanguages(token: string): Promise<(string | null)[]>;
}
