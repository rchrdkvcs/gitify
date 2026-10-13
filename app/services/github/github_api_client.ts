import type {
  GitHubIssue,
  GitHubRepository,
  RepositorySnapshot,
} from "#services/github/github_adapter";
import type { Difficulty, IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { GitHubAdapter } from "#services/github/github_adapter";
import { GitHubInvalidResponseError } from "#services/github/github_errors";
import { GitHubTransport } from "#services/github/github_transport";
import { searchIssues } from "#services/github/issue_search";
import { searchRepositories } from "#services/github/repository_search";
import { assembleRepositorySnapshot } from "#services/github/repository_snapshot";

export default class GitHubApiClient extends GitHubAdapter {
  private readonly transport: GitHubTransport;

  constructor(
    request: typeof fetch = globalThis.fetch,
    timeoutMs = 10_000,
    private readonly now: () => Date = () => new Date(),
  ) {
    super();
    this.transport = new GitHubTransport(request, timeoutMs, now);
  }

  searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage: number = gitifyConfig.github.search.defaultPerPage,
  ): Promise<GitHubRepository[]> {
    return searchRepositories(this.transport, { language, difficulty, token, perPage });
  }

  searchIssues(
    language: string,
    kind: IssueKind,
    token: string,
    perPage: number = gitifyConfig.github.issues.searchPerPage,
  ): Promise<GitHubIssue[]> {
    return searchIssues(this.transport, { language, kind, token, perPage });
  }

  getRepositorySnapshot(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<RepositorySnapshot> {
    return assembleRepositorySnapshot(this.transport, { ownerName, repoName, token }, this.now);
  }

  async listUserRepositoryLanguages(token: string): Promise<(string | null)[]> {
    const { data } = await this.transport.data(
      `${gitifyConfig.github.userReposUrl}?affiliation=owner&sort=pushed&per_page=${gitifyConfig.github.userRepositoriesLimit}`,
      { token },
    );
    if (!Array.isArray(data)) {
      throw new GitHubInvalidResponseError("user repositories");
    }
    return (data as { language?: unknown; fork?: unknown }[])
      .filter((repo) => repo && repo.fork !== true)
      .map((repo) => (typeof repo.language === "string" ? repo.language : null));
  }
}
