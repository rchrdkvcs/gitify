import { inject } from "@adonisjs/core";
import type { Difficulty, IssueKind } from "#shared/types/index";
import { GitHubAdapter } from "#services/github/github_adapter";
import GitHubCredentials from "#services/github/github_credentials";
import { GitHubAuthError, GitHubRateLimitError } from "#services/github/github_errors";

@inject()
export default class CredentialFallbackAdapter extends GitHubAdapter {
  constructor(
    private readonly inner: GitHubAdapter,
    private readonly credentials: GitHubCredentials,
  ) {
    super();
  }

  searchIssues(language: string, kind: IssueKind, token: string, perPage?: number) {
    return this.withFallback(token, (attempt) =>
      this.inner.searchIssues(language, kind, attempt, perPage),
    );
  }

  searchRepositories(language: string, difficulty: Difficulty, token: string, perPage?: number) {
    return this.withFallback(token, (attempt) =>
      this.inner.searchRepositories(language, difficulty, attempt, perPage),
    );
  }

  getRepositorySnapshot(ownerName: string, repoName: string, token: string) {
    return this.withFallback(token, (attempt) =>
      this.inner.getRepositorySnapshot(ownerName, repoName, attempt),
    );
  }

  listUserRepositoryLanguages(token: string) {
    return this.inner.listUserRepositoryLanguages(token);
  }

  private async withFallback<T>(token: string, call: (token: string) => Promise<T>): Promise<T> {
    try {
      return await call(token);
    } catch (error) {
      const fallback = this.credentials.fallbackFor(token);
      if (fallback && isCredentialFailure(error)) {
        return call(fallback);
      }
      throw error;
    }
  }
}

function isCredentialFailure(error: unknown): boolean {
  return error instanceof GitHubAuthError || error instanceof GitHubRateLimitError;
}
