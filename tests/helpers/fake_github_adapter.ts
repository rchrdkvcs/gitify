import type {
  GitHubAdapter,
  GitHubRepo,
  ProjectDetails,
  RepositoryInsightsResult,
} from "#services/github/github_adapter";
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
  insightsCalls: { ownerName: string; repoName: string; token: string }[] = [];
  userRepositoryCalls: string[] = [];
  repos: GitHubRepo[] = [];
  /** Primary languages of the signed-in user's repositories, most recently pushed first. */
  userRepositoryLanguages: (string | null)[] = [];
  details: ProjectDetails = {
    readme: null,
    languages: null,
    contributors: [],
    latestRelease: null,
    totalContributorsCount: 0,
  };
  insights: RepositoryInsightsResult = {
    contributing: null,
    metadata: {
      ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
      homepageUrl: null,
      license: "MIT",
      pushedAt: "2026-10-01T00:00:00Z",
      createdAt: "2020-01-01T00:00:00Z",
      stars: 5,
      forksCount: 1,
    },
    insights: {
      watchers: 1,
      openIssues: 1,
      closedIssues: 0,
      openPullRequests: 0,
      mergedPullRequests: 0,
      goodFirstIssues: 0,
      helpWantedIssues: 0,
      commits: 10,
      releases: 0,
      latestReleaseAt: null,
      diskUsageKb: 100,
      defaultBranch: "main",
      isArchived: false,
      lastCommitAt: "2026-10-01T00:00:00Z",
      languages: [],
      weeklyCommits: null,
      health: null,
      issues: [],
      beginnerIssues: [],
      pullRequests: [],
    },
  };
  searchError?: Error;
  detailsError?: Error;
  userRepositoriesError?: Error;

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

  async getRepositoryInsights(ownerName: string, repoName: string, token: string) {
    this.insightsCalls.push({ ownerName, repoName, token });
    if (this.detailsError) {
      throw this.detailsError;
    }
    return this.insights;
  }

  async listUserRepositoryLanguages(token: string) {
    this.userRepositoryCalls.push(token);
    if (this.userRepositoriesError) {
      throw this.userRepositoriesError;
    }
    return this.userRepositoryLanguages;
  }
}

/** Recent outside contribution as returned by the GraphQL activity sample. */
export function graphqlActivityItem(
  overrides: {
    createdAt?: string;
    state?: "OPEN" | "CLOSED" | "MERGED";
    authorAssociation?: string;
    bot?: boolean;
    mergedAt?: string | null;
    replies?: { createdAt: string; authorAssociation: string }[];
  } = {},
) {
  return {
    createdAt: overrides.createdAt ?? "2026-09-01T00:00:00Z",
    state: overrides.state ?? "OPEN",
    authorAssociation: overrides.authorAssociation ?? "NONE",
    author: { __typename: overrides.bot ? "Bot" : "User" },
    comments: { nodes: overrides.replies ?? [] },
    mergedAt: overrides.mergedAt ?? null,
    reviews: { nodes: [] },
  };
}

const emptyConnection = { totalCount: 0 };

/** Minimal GraphQL `repository` payload accepted by the HTTP adapter. */
export function graphqlRepository() {
  return {
    data: {
      repository: {
        createdAt: "2020-01-01T00:00:00Z",
        pushedAt: null,
        homepageUrl: null,
        isArchived: false,
        diskUsage: 1,
        stargazerCount: 0,
        forkCount: 0,
        owner: { avatarUrl: "https://avatars.githubusercontent.com/u/1" },
        licenseInfo: null,
        watchers: emptyConnection,
        openIssues: emptyConnection,
        closedIssues: emptyConnection,
        openPullRequests: emptyConnection,
        mergedPullRequests: emptyConnection,
        goodFirstIssues: emptyConnection,
        helpWantedIssues: emptyConnection,
        releases: emptyConnection,
        latestRelease: null,
        languages: { edges: [] },
        defaultBranchRef: null,
        recentIssues: { nodes: [] },
        beginnerIssues: { nodes: [] },
        recentPullRequests: { nodes: [] },
        activityIssues: { nodes: [] as ReturnType<typeof graphqlActivityItem>[] },
        activityPullRequests: { nodes: [] as ReturnType<typeof graphqlActivityItem>[] },
        lastMergedPullRequest: { nodes: [] as { mergedAt: string | null }[] },
      },
    },
  };
}
