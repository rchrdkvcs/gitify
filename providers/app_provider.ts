import type { ApplicationService } from "@adonisjs/core/types";
import IssueFeed from "#services/feeds/issue_feed";
import ProjectCatalogue from "#services/feeds/project_catalogue";
import ProjectDetailReader from "#services/feeds/project_detail";
import ProjectShowcase from "#services/feeds/project_showcase";
import CredentialFallbackAdapter from "#services/github/credential_fallback_adapter";
import { GitHubAdapter } from "#services/github/github_adapter";
import GitHubApiClient from "#services/github/github_api_client";
import GitHubCredentials from "#services/github/github_credentials";
import GitHubIssueSyncService from "#services/github/github_issue_sync_service";
import GitHubSyncService from "#services/github/github_sync_service";
import OnboardingService from "#services/onboarding_service";
import env from "#start/env";

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    const { container } = this.app;

    container.singleton(
      GitHubCredentials,
      () => new GitHubCredentials(env.get("GITHUB_SERVER_TOKEN")),
    );
    container.bind(GitHubAdapter, () => new GitHubApiClient());

    container.bind(
      GitHubSyncService,
      async (resolver) => new GitHubSyncService(await resolver.make(CredentialFallbackAdapter)),
    );
    container.bind(
      GitHubIssueSyncService,
      async (resolver) =>
        new GitHubIssueSyncService(await resolver.make(CredentialFallbackAdapter)),
    );
    container.bind(
      OnboardingService,
      async (resolver) => new OnboardingService(await resolver.make(GitHubAdapter)),
    );

    container.bind(
      ProjectCatalogue,
      async (resolver) => new ProjectCatalogue(await resolver.make(GitHubSyncService)),
    );
    container.bind(
      ProjectDetailReader,
      async (resolver) => new ProjectDetailReader(await resolver.make(GitHubSyncService)),
    );
    container.bind(
      ProjectShowcase,
      async (resolver) => new ProjectShowcase(await resolver.make(GitHubSyncService)),
    );
    container.bind(
      IssueFeed,
      async (resolver) => new IssueFeed(await resolver.make(GitHubIssueSyncService)),
    );
  }
}
