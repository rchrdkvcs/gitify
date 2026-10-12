import type {
  GitHubAdapter,
  GitHubIssue,
  GitHubIssueRepository,
  GitHubRepo,
  ProjectDetails,
  RepositoryInsightsResult,
} from "#services/github/github_adapter";
import type { Difficulty, IssueKind } from "#shared/types/index";

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

export function githubIssue(
  overrides: Partial<Omit<GitHubIssue, "repository">> & {
    repository?: Partial<GitHubIssueRepository>;
  } = {},
): GitHubIssue {
  const { repository, ...issue } = overrides;
  const id = issue.id ?? 5001;
  return {
    id,
    number: id - 5000,
    title: `Issue ${id}`,
    url: `https://github.com/owner/repo-201/issues/${id - 5000}`,
    createdAt: "2026-10-01T00:00:00Z",
    comments: 0,
    assignees: 0,
    linkedPullRequests: 0,
    labels: [{ name: "good first issue", color: "7057ff" }],
    ...issue,
    repository: {
      id: 201,
      name: "repo-201",
      ownerLogin: "owner",
      ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
      url: "https://github.com/owner/repo-201",
      description: null,
      stars: 10,
      forksCount: 1,
      openIssuesCount: 3,
      language: "TypeScript",
      topics: [],
      homepageUrl: null,
      license: null,
      pushedAt: "2026-10-01T00:00:00Z",
      createdAt: "2020-01-01T00:00:00Z",
      isArchived: false,
      isPrivate: false,
      ...repository,
    },
  };
}

export class FakeGitHubAdapter implements GitHubAdapter {
  searchCalls: { language: string; difficulty: Difficulty; token: string; perPage?: number }[] = [];
  issueSearchCalls: { language: string; kind: IssueKind; token: string; perPage?: number }[] = [];
  issues: GitHubIssue[] = [];
  issueSearchError?: Error;
  detailsCalls: { ownerName: string; repoName: string; token: string }[] = [];
  insightsCalls: { ownerName: string; repoName: string; token: string }[] = [];
  repos: GitHubRepo[] = [];
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

  async searchIssues(language: string, kind: IssueKind, token: string, perPage?: number) {
    this.issueSearchCalls.push({ language, kind, token, perPage });
    if (this.issueSearchError) {
      throw this.issueSearchError;
    }
    return this.issues;
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
      },
    },
  };
}
