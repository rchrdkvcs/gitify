import type { Difficulty, IssueKind, RepositoryInsights } from "#shared/types/index";

export interface GitHubRepository {
  id: number;
  name: string;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  url: string;
  description: string | null;
  stars: number;
  forksCount: number;
  openIssuesCount: number;
  language: string | null;
  topics: string[];
  homepageUrl: string | null;
  license: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  isArchived: boolean;
  isPrivate: boolean;
  hasIssues: boolean;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  comments: number;
  assignees: number;
  linkedPullRequests: number;
  labels: { name: string; color: string }[];
  repository: GitHubRepository;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}

export interface RepositorySnapshot {
  readme: string | null;
  languages: Record<string, number>;
  contributors: GitHubContributor[];
  totalContributorsCount: number;
  latestRelease: string | null;
  contributing: string | null;
  repository: {
    ownerAvatarUrl: string;
    homepageUrl: string | null;
    license: string | null;
    pushedAt: string | null;
    createdAt: string;
    stars: number;
    forksCount: number;
  };
  insights: RepositoryInsights;
}

export abstract class GitHubAdapter {
  abstract searchIssues(
    language: string,
    kind: IssueKind,
    token: string,
    perPage?: number,
  ): Promise<GitHubIssue[]>;
  abstract searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage?: number,
  ): Promise<GitHubRepository[]>;
  abstract getRepositorySnapshot(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<RepositorySnapshot>;
  abstract listUserRepositoryLanguages(token: string): Promise<(string | null)[]>;
}
