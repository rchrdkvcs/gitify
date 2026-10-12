import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import type { GitHubAdapter } from "#services/github/github_adapter";
import gitifyConfig from "#config/gitify";
import Contributor from "#models/contributor";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import GitHubApiClient from "#services/github/github_api_client";

export type SearchCriteria = {
  language: string;
  difficulty: "beginner" | "expert";
  token: string;
};

export type SearchFreshness =
  | { status: "fresh" | "pending" }
  | { status: "refreshed"; totalStored: number };

export class SearchRetryDeferredError extends Error {
  constructor() {
    super("GitHub search temporarily unavailable; retry deferred");
  }
}

// Shared by every synchronization instance; permits are taken before reserving a DB connection.
let activeSearches = 0;

export class GitHubSyncService {
  constructor(
    private readonly github: GitHubAdapter = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  /** Refresh one criterion atomically; occupied permits serve the existing snapshot. */
  async ensureSearchFresh(criteria: SearchCriteria): Promise<SearchFreshness> {
    return this.refreshSearch(criteria, false);
  }

  /** Administrative imports use the same complete search coverage and resource budget. */
  async fetchAndStore(
    language: string,
    difficulty: "beginner" | "expert",
    token: string,
  ): Promise<number> {
    const result = await this.refreshSearch({ language, difficulty, token }, true);
    if (result.status !== "refreshed") {
      throw new Error("GitHub search refresh already in progress");
    }
    return result.totalStored;
  }

  private isFresh(cache: GithubFetchCache | null): boolean {
    return (
      !!cache?.fetchedAt &&
      this.now().diff(cache.fetchedAt, "hours").hours < gitifyConfig.cache.fetchTtlHours
    );
  }

  private assertRetryAllowed(cache: GithubFetchCache | null): void {
    if (cache?.retryAfter && cache.retryAfter.toMillis() > this.now().toMillis()) {
      throw new SearchRetryDeferredError();
    }
  }

  private async readSearchCache(criteria: SearchCriteria, trx?: TransactionClientContract) {
    return GithubFetchCache.query(trx ? { client: trx } : {})
      .where("language", criteria.language)
      .where("difficulty", criteria.difficulty)
      .first();
  }

  private async refreshSearch(input: SearchCriteria, force: boolean): Promise<SearchFreshness> {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    // Cached requests never queue behind network requests for a permit or transaction connection.
    const cache = await this.readSearchCache(criteria);
    if (!force && this.isFresh(cache)) {
      return { status: "fresh" };
    }
    this.assertRetryAllowed(cache);
    if (activeSearches >= gitifyConfig.cache.maxConcurrentSearches) {
      return { status: "pending" };
    }
    activeSearches++;
    try {
      return await db.transaction(async (trx) => {
        const lock = await trx.rawQuery(
          "SELECT pg_try_advisory_xact_lock(hashtext(?)) AS acquired",
          [`project-search:${criteria.language}:${criteria.difficulty}`],
        );
        if (!lock.rows[0].acquired) {
          return { status: "pending" };
        }
        const current = await this.readSearchCache(criteria, trx);
        if (!force && this.isFresh(current)) {
          return { status: "fresh" };
        }
        this.assertRetryAllowed(current);
        const totalStored = await this.importSearch(criteria, trx);
        return { status: "refreshed", totalStored };
      });
    } catch (error) {
      // The failed transaction has rolled back before failure metadata is written.
      if (!(error instanceof SearchRetryDeferredError)) {
        await this.recordSearchFailure(criteria);
      }
      throw error;
    } finally {
      activeSearches--;
    }
  }

  private async recordSearchFailure(criteria: SearchCriteria): Promise<void> {
    await db.transaction(async (trx) => {
      const lock = await trx.rawQuery("SELECT pg_try_advisory_xact_lock(hashtext(?)) AS acquired", [
        `project-search:${criteria.language}:${criteria.difficulty}`,
      ]);
      // Another process owns this criterion and will publish its own outcome.
      if (!lock.rows[0].acquired) {
        return;
      }
      const current = await this.readSearchCache(criteria, trx);
      if (this.isFresh(current)) {
        return;
      }
      const retryAfter = this.now().plus({ seconds: gitifyConfig.cache.searchRetrySeconds });
      if (current) {
        current.retryAfter = retryAfter;
        await current.save();
      } else {
        await GithubFetchCache.create(
          {
            language: criteria.language,
            difficulty: criteria.difficulty,
            fetchedAt: null,
            totalStored: 0,
            retryAfter,
          },
          { client: trx },
        );
      }
    });
  }

  private async importSearch(
    { language: searchLanguage, difficulty, token }: SearchCriteria,
    trx: TransactionClientContract,
  ): Promise<number> {
    const repos = await this.github.searchRepositories(
      searchLanguage,
      difficulty,
      token,
      gitifyConfig.github.search.defaultPerPage,
    );
    const validRepos = repos.filter((repo) => repo.has_issues && repo.open_issues_count > 0);
    // Search criteria describe membership, while the repository has one stable identity.
    await ProjectSearchMembership.query({ client: trx })
      .where("language", searchLanguage)
      .where("difficulty", difficulty)
      .delete();

    // Lock identities in a fixed order so simultaneous language imports can share repositories.
    for (const repo of [...validRepos].sort((a, b) => a.id - b.id)) {
      await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtext(?))", [
        `project-identity:${repo.id}`,
      ]);
      const metadata = {
        ownerName: repo.owner.login,
        name: repo.name,
        description: repo.description,
        repositoryUrl: repo.html_url,
        stars: repo.stargazers_count,
        forksCount: repo.forks_count,
        language: repo.language?.toLowerCase() ?? searchLanguage,
        topics: repo.topics ?? [],
        openIssuesCount: repo.open_issues_count,
        ownerAvatarUrl: repo.owner.avatar_url ?? null,
        homepageUrl: repo.homepage || null,
        license: repo.license ? (repo.license.spdx_id ?? repo.license.name) : null,
        pushedAt: repo.pushed_at ? DateTime.fromISO(repo.pushed_at) : null,
        githubCreatedAt: repo.created_at ? DateTime.fromISO(repo.created_at) : null,
      };
      const project = await Project.firstOrCreate(
        { githubRepoId: repo.id },
        { ...metadata, difficulty },
        { client: trx },
      );
      project.merge(metadata);
      await project.save();
      await ProjectSearchMembership.firstOrCreate(
        { projectId: project.id, language: searchLanguage, difficulty },
        {},
        { client: trx },
      );
    }

    await GithubFetchCache.updateOrCreate(
      { language: searchLanguage, difficulty },
      { totalStored: validRepos.length, fetchedAt: this.now(), retryAfter: null },
      { client: trx },
    );
    return validRepos.length;
  }

  needsDetailsFetch(project: Project): boolean {
    if (!project.detailsFetchedAt) {
      return true;
    }
    const hoursSince = this.now().diff(project.detailsFetchedAt, "hours").hours;
    return hoursSince >= gitifyConfig.cache.detailsCacheHours;
  }

  async fetchProjectDetails(project: Project, token: string): Promise<void> {
    const [details, { insights, contributing, metadata }] = await Promise.all([
      this.github.getProjectDetails(project.ownerName, project.name, token),
      this.github.getRepositoryInsights(project.ownerName, project.name, token),
    ]);

    await db.transaction(async (trx) => {
      // Keep the caller's model untouched until the entire snapshot commits.
      const stored = await Project.query({ client: trx })
        .where("id", project.id)
        .forUpdate()
        .firstOrFail();
      stored.merge({
        readme: details.readme,
        languages: details.languages,
        latestRelease: details.latestRelease,
        totalContributorsCount: details.totalContributorsCount,
        insights,
        contributing,
        stars: metadata.stars,
        forksCount: metadata.forksCount,
        ownerAvatarUrl: metadata.ownerAvatarUrl,
        homepageUrl: metadata.homepageUrl,
        license: metadata.license,
        pushedAt: metadata.pushedAt ? DateTime.fromISO(metadata.pushedAt) : stored.pushedAt,
        githubCreatedAt: DateTime.fromISO(metadata.createdAt),
        detailsFetchedAt: this.now(),
      });
      await stored.save();

      const previousContributors = Contributor.query({ client: trx }).where(
        "projectId",
        project.id,
      );
      if (details.contributors.length > 0) {
        previousContributors.whereNotIn(
          "githubUserId",
          details.contributors.map((c) => c.id),
        );
      }
      await previousContributors.delete();

      for (const c of details.contributors) {
        await Contributor.updateOrCreate(
          { projectId: project.id, githubUserId: c.id },
          {
            login: c.login,
            avatarUrl: c.avatar_url,
            profileUrl: c.html_url,
            contributions: c.contributions,
          },
          { client: trx },
        );
      }
    });
    await project.refresh();
  }
}

export default new GitHubSyncService();
