import app from "@adonisjs/core/services/app";
import { GitHubAdapter } from "#services/github/github_adapter";
import GitHubCredentials from "#services/github/github_credentials";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

export function keepGitHubOffline() {
  app.container.bind(GitHubAdapter, () => new FakeGitHubAdapter());
  app.container.singleton(GitHubCredentials, () => new GitHubCredentials(null));
}

export function swapGitHub({ serverToken = null }: { serverToken?: string | null } = {}) {
  const github = new FakeGitHubAdapter();
  app.container.swap(GitHubAdapter, () => github);
  app.container.swap(GitHubCredentials, () => new GitHubCredentials(serverToken));
  return github;
}

export function restoreGitHub() {
  app.container.restoreAll([GitHubAdapter, GitHubCredentials]);
}
