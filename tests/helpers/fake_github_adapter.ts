import type {
  GitHubAdapter,
  GitHubContributor,
  GitHubIssue,
  GitHubRepository,
  RepositorySnapshot,
} from "#services/github/github_adapter";
import type { GitHubError } from "#services/github/github_errors";
import type { Difficulty, IssueKind, RepositoryInsights } from "#shared/types/index";

export function githubRepository(overrides: Partial<GitHubRepository> = {}): GitHubRepository {
  return {
    id: 101,
    name: "repo-101",
    ownerLogin: "owner",
    ownerAvatarUrl: null,
    url: "https://github.com/owner/repo-101",
    description: null,
    stars: 5,
    forksCount: 1,
    openIssuesCount: 1,
    language: "TypeScript",
    topics: [],
    homepageUrl: null,
    license: null,
    pushedAt: null,
    createdAt: null,
    isArchived: false,
    isPrivate: false,
    hasIssues: true,
    ...overrides,
  };
}

export function githubIssue(
  overrides: Partial<Omit<GitHubIssue, "repository">> & {
    repository?: Partial<GitHubRepository>;
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
    repository: githubRepository({
      id: 201,
      name: "repo-201",
      ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
      url: "https://github.com/owner/repo-201",
      stars: 10,
      openIssuesCount: 3,
      pushedAt: "2026-10-01T00:00:00Z",
      createdAt: "2020-01-01T00:00:00Z",
      ...repository,
    }),
  };
}

export function githubContributor(id: number, contributions = 10): GitHubContributor {
  return {
    id,
    login: `contributor-${id}`,
    avatarUrl: `https://github.com/avatar/${id}`,
    profileUrl: `https://github.com/contributor-${id}`,
    contributions,
  };
}

export function repositoryInsights(
  overrides: Partial<RepositoryInsights> = {},
): RepositoryInsights {
  return {
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
    ...overrides,
  };
}

export function repositorySnapshot(
  overrides: Partial<RepositorySnapshot> = {},
): RepositorySnapshot {
  return {
    readme: null,
    languages: {},
    contributors: [],
    totalContributorsCount: 0,
    latestRelease: null,
    contributing: null,
    repository: {
      ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
      homepageUrl: null,
      license: "MIT",
      pushedAt: "2026-10-01T00:00:00Z",
      createdAt: "2020-01-01T00:00:00Z",
      stars: 5,
      forksCount: 1,
    },
    insights: repositoryInsights(),
    ...overrides,
  };
}

export class FakeGitHubAdapter implements GitHubAdapter {
  searchCalls: { language: string; difficulty: Difficulty; token: string; perPage?: number }[] = [];
  issueSearchCalls: { language: string; kind: IssueKind; token: string; perPage?: number }[] = [];
  snapshotCalls: { ownerName: string; repoName: string; token: string }[] = [];
  userRepositoryCalls: string[] = [];
  repos: GitHubRepository[] = [];
  issues: GitHubIssue[] = [];
  snapshot: RepositorySnapshot = repositorySnapshot();
  userRepositoryLanguages: (string | null)[] = [];
  searchError?: GitHubError;
  issueSearchError?: GitHubError;
  snapshotError?: GitHubError;
  userRepositoriesError?: GitHubError;
  tokenErrors = new Map<string, GitHubError>();

  async searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage?: number,
  ) {
    this.searchCalls.push({ language, difficulty, token, perPage });
    this.failFor(token, this.searchError);
    return structuredClone(this.repos);
  }

  async searchIssues(language: string, kind: IssueKind, token: string, perPage?: number) {
    this.issueSearchCalls.push({ language, kind, token, perPage });
    this.failFor(token, this.issueSearchError);
    return structuredClone(this.issues);
  }

  async getRepositorySnapshot(ownerName: string, repoName: string, token: string) {
    this.snapshotCalls.push({ ownerName, repoName, token });
    this.failFor(token, this.snapshotError);
    return structuredClone(this.snapshot);
  }

  async listUserRepositoryLanguages(token: string) {
    this.userRepositoryCalls.push(token);
    this.failFor(token, this.userRepositoriesError);
    return [...this.userRepositoryLanguages];
  }

  private failFor(token: string, error?: GitHubError) {
    const failure = this.tokenErrors.get(token) ?? error;
    if (failure) {
      throw failure;
    }
  }
}
