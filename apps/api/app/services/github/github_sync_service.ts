import gitifyConfig from "#config/gitify";
import Contributor from "#models/contributor";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import GitHubApiClient from "#services/github/github_api_client";
import { DateTime } from "luxon";

export default class GitHubSyncService {
  static async needsFetch(language: string, difficulty: "beginner" | "expert"): Promise<boolean> {
    const cache = await GithubFetchCache.query()
      .where("language", language.toLowerCase())
      .where("difficulty", difficulty)
      .first();

    if (!cache) {
      return true;
    }

    const hoursSinceLastFetch = DateTime.now().diff(cache.fetchedAt, "hours").hours;
    return hoursSinceLastFetch >= gitifyConfig.cache.fetchTtlHours;
  }

  static async fetchAndStore(
    language: string,
    difficulty: "beginner" | "expert",
    token: string,
    perPage: number = gitifyConfig.github.search.defaultPerPage,
  ): Promise<number> {
    const repos = await GitHubApiClient.searchRepositories(language, difficulty, token, perPage);

    // GitHub counts PRs in open_issues_count — filter repos that have real issues
    const validRepos = repos.filter((repo) => repo.has_issues && repo.open_issues_count > 0);

    await Promise.all(
      validRepos.map((repo) =>
        Project.updateOrCreate(
          { githubRepoId: repo.id },
          {
            ownerName: repo.owner.login,
            name: repo.name,
            description: repo.description,
            repositoryUrl: repo.html_url,
            stars: repo.stargazers_count,
            forksCount: repo.forks_count,
            language: repo.language?.toLowerCase() ?? language,
            topics: repo.topics ?? [],
            openIssuesCount: repo.open_issues_count,
            difficulty,
          },
        ),
      ),
    );

    await GithubFetchCache.updateOrCreate(
      { language: language.toLowerCase(), difficulty },
      { totalStored: validRepos.length, fetchedAt: DateTime.now() },
    );

    return validRepos.length;
  }

  static needsDetailsFetch(project: Project): boolean {
    if (!project.detailsFetchedAt) {
      return true;
    }
    const daysSince = DateTime.now().diff(project.detailsFetchedAt, "days").days;
    return daysSince >= gitifyConfig.cache.detailsCacheDays;
  }

  static async fetchProjectDetails(project: Project, token: string): Promise<void> {
    const details = await GitHubApiClient.getProjectDetails(project.ownerName, project.name, token);

    project.readme = details.readme;
    project.languages = details.languages;
    project.latestRelease = details.latestRelease;
    project.totalContributorsCount = details.totalContributorsCount;
    project.detailsFetchedAt = DateTime.now();
    await project.save();

    await Promise.all(
      details.contributors.map((c) =>
        Contributor.updateOrCreate(
          { projectId: project.id, githubUserId: c.id },
          {
            login: c.login,
            avatarUrl: c.avatar_url,
            profileUrl: c.html_url,
            contributions: c.contributions,
          },
        ),
      ),
    );
  }
}
