import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import type { GitHubAdapter } from "#services/github/github_adapter";
import gitifyConfig from "#config/gitify";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import GitHubApiClient from "#services/github/github_api_client";
import { storeRepositorySnapshot } from "#services/github/repository_snapshot_store";

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

let activeSearches = 0;

export function tryAcquireSearchPermit(): boolean {
  if (activeSearches >= gitifyConfig.cache.maxConcurrentSearches) {
    return false;
  }
  activeSearches++;
  return true;
}

export function releaseSearchPermit(): void {
  activeSearches--;
}

export class GitHubSyncService {
  constructor(
    private readonly github: GitHubAdapter = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  async ensureSearchFresh(criteria: SearchCriteria): Promise<SearchFreshness> {
    return this.refreshSearch(criteria, false);
  }

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
    const cache = await this.readSearchCache(criteria);
    if (!force && this.isFresh(cache)) {
      return { status: "fresh" };
    }
    this.assertRetryAllowed(cache);
    if (!tryAcquireSearchPermit()) {
      return { status: "pending" };
    }
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
      if (!(error instanceof SearchRetryDeferredError)) {
        await this.recordSearchFailure(criteria);
      }
      throw error;
    } finally {
      releaseSearchPermit();
    }
  }

  private async recordSearchFailure(criteria: SearchCriteria): Promise<void> {
    await db.transaction(async (trx) => {
      const lock = await trx.rawQuery("SELECT pg_try_advisory_xact_lock(hashtext(?)) AS acquired", [
        `project-search:${criteria.language}:${criteria.difficulty}`,
      ]);
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
    const validRepos = repos.filter((repo) => repo.hasIssues && repo.openIssuesCount > 0);
    await ProjectSearchMembership.query({ client: trx })
      .where("language", searchLanguage)
      .where("difficulty", difficulty)
      .delete();

    for (const repo of [...validRepos].sort((a, b) => a.id - b.id)) {
      await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtext(?))", [
        `project-identity:${repo.id}`,
      ]);
      const metadata = {
        ownerName: repo.ownerLogin,
        name: repo.name,
        description: repo.description,
        repositoryUrl: repo.url,
        stars: repo.stars,
        forksCount: repo.forksCount,
        language: repo.language?.toLowerCase() ?? searchLanguage,
        topics: repo.topics,
        openIssuesCount: repo.openIssuesCount,
        ownerAvatarUrl: repo.ownerAvatarUrl,
        homepageUrl: repo.homepageUrl,
        license: repo.license,
        pushedAt: repo.pushedAt ? DateTime.fromISO(repo.pushedAt) : null,
        githubCreatedAt: repo.createdAt ? DateTime.fromISO(repo.createdAt) : null,
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
    const snapshot = await this.github.getRepositorySnapshot(
      project.ownerName,
      project.name,
      token,
    );
    await storeRepositorySnapshot(project.id, snapshot, this.now());
    await project.refresh();
  }
}

export default new GitHubSyncService();
