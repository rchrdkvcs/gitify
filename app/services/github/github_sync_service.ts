import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import { ulid } from "ulid";
import type Project from "#models/project";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import GithubFetchCache from "#models/github_fetch_cache";
import ProjectSearchMembership from "#models/project_search_membership";
import {
  postponeRepositorySnapshot,
  storeRepositorySnapshot,
} from "#services/github/repository_snapshot_store";
import { upsertRepositories } from "#services/repository_identity";
import { retryAfterFailure } from "#services/search_freshness/retry_cooldown";
import {
  type SearchFreshness,
  SearchFreshnessPolicy,
  type SnapshotRefresh,
  type SnapshotStore,
} from "#services/search_freshness/search_freshness";

const detailsRefreshes = new Map<Project["id"], Promise<void>>();

export type SearchCriteria = {
  language: string;
  difficulty: Difficulty;
  token: string;
};

export default class GitHubSyncService {
  private readonly freshness: SearchFreshnessPolicy;

  constructor(
    private readonly github: GitHubAdapter,
    private readonly now: () => DateTime = () => DateTime.now(),
    freshness?: SearchFreshnessPolicy,
  ) {
    this.freshness = freshness ?? new SearchFreshnessPolicy(now);
  }

  async ensureSearchFresh(criteria: SearchCriteria): Promise<SearchFreshness> {
    return this.freshness.ensureFresh(this.refreshSearch(criteria, false));
  }

  async revalidateSearch(criteria: SearchCriteria): Promise<SearchFreshness> {
    return this.freshness.revalidate(this.refreshSearch(criteria, false));
  }

  async fetchAndStore(language: string, difficulty: Difficulty, token: string): Promise<number> {
    const result = await this.freshness.ensureFresh(
      this.refreshSearch({ language, difficulty, token }, true),
    );
    if (result.status !== "refreshed") {
      throw new Error("GitHub search refresh already in progress");
    }
    return result.totalStored;
  }

  private refreshSearch(input: SearchCriteria, force: boolean): SnapshotRefresh {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    return {
      key: `project-search:${criteria.language}:${criteria.difficulty}`,
      ttlHours: gitifyConfig.cache.fetchTtlHours,
      store: projectSearchStore(criteria),
      importSnapshot: (trx) => this.importSearch(criteria, trx),
      force,
    };
  }

  private async importSearch(
    { language, difficulty, token }: SearchCriteria,
    trx: TransactionClientContract,
  ): Promise<number> {
    const repositories = await this.github.searchRepositories(
      language,
      difficulty,
      token,
      gitifyConfig.github.search.defaultPerPage,
    );
    const searchable = repositories.filter((repo) => repo.hasIssues && repo.openIssuesCount > 0);
    await ProjectSearchMembership.query({ client: trx })
      .where("language", language)
      .where("difficulty", difficulty)
      .delete();
    const projectIds = await upsertRepositories(
      searchable,
      { searchLanguage: language, legacyDifficulty: difficulty, topics: "refresh" },
      trx,
    );
    if (projectIds.size > 0) {
      await trx
        .knexQuery()
        .table("project_search_memberships")
        .insert(
          [...projectIds.values()].map((projectId) => ({
            id: ulid(),
            project_id: projectId,
            language,
            difficulty,
          })),
        )
        .onConflict(["language", "difficulty", "project_id"])
        .ignore();
    }
    return searchable.length;
  }

  needsDetailsFetch(project: Project): boolean {
    if (project.detailsRetryAfter && project.detailsRetryAfter > this.now()) {
      return false;
    }
    if (!project.detailsFetchedAt) {
      return true;
    }
    const hoursSince = this.now().diff(project.detailsFetchedAt, "hours").hours;
    return hoursSince >= gitifyConfig.cache.detailsCacheHours;
  }

  async fetchProjectDetails(project: Project, token: string): Promise<void> {
    const refresh = detailsRefreshes.get(project.id) ?? this.startDetailsRefresh(project, token);
    await refresh.finally(() => project.refresh());
  }

  private startDetailsRefresh(project: Project, token: string): Promise<void> {
    const refresh = this.storeProjectDetails(project, token).finally(() =>
      detailsRefreshes.delete(project.id),
    );
    detailsRefreshes.set(project.id, refresh);
    return refresh;
  }

  private async storeProjectDetails(project: Project, token: string): Promise<void> {
    try {
      const snapshot = await this.github.getRepositorySnapshot(
        project.ownerName,
        project.name,
        token,
      );
      await storeRepositorySnapshot(project.id, snapshot, this.now());
    } catch (error) {
      await postponeRepositorySnapshot(
        project.id,
        retryAfterFailure(error, this.now(), gitifyConfig.cache.detailsRetrySeconds),
      );
      throw error;
    }
  }
}

function projectSearchStore({ language, difficulty }: SearchCriteria): SnapshotStore {
  return {
    read: (trx) =>
      GithubFetchCache.query(trx ? { client: trx } : {})
        .where("language", language)
        .where("difficulty", difficulty)
        .first(),
    save: async (changes, trx) => {
      await GithubFetchCache.updateOrCreate({ language, difficulty }, changes, { client: trx });
    },
  };
}
