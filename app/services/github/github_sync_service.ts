import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import type Project from "#models/project";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import GithubFetchCache from "#models/github_fetch_cache";
import ProjectSearchMembership from "#models/project_search_membership";
import GitHubApiClient from "#services/github/github_api_client";
import { storeRepositorySnapshot } from "#services/github/repository_snapshot_store";
import { upsertRepositories } from "#services/repository_identity";
import {
  type SearchFreshness,
  SearchFreshnessPolicy,
  type SnapshotStore,
} from "#services/search_freshness/search_freshness";

export type SearchCriteria = {
  language: string;
  difficulty: Difficulty;
  token: string;
};

export class GitHubSyncService {
  private readonly freshness: SearchFreshnessPolicy;

  constructor(
    private readonly github: GitHubAdapter = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
    freshness?: SearchFreshnessPolicy,
  ) {
    this.freshness = freshness ?? new SearchFreshnessPolicy(now);
  }

  async ensureSearchFresh(criteria: SearchCriteria): Promise<SearchFreshness> {
    return this.refreshSearch(criteria, false);
  }

  async fetchAndStore(language: string, difficulty: Difficulty, token: string): Promise<number> {
    const result = await this.refreshSearch({ language, difficulty, token }, true);
    if (result.status !== "refreshed") {
      throw new Error("GitHub search refresh already in progress");
    }
    return result.totalStored;
  }

  private refreshSearch(input: SearchCriteria, force: boolean): Promise<SearchFreshness> {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    return this.freshness.ensureFresh({
      key: `project-search:${criteria.language}:${criteria.difficulty}`,
      ttlHours: gitifyConfig.cache.fetchTtlHours,
      store: projectSearchStore(criteria),
      importSnapshot: (trx) => this.importSearch(criteria, trx),
      force,
    });
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
    const projects = await upsertRepositories(
      searchable,
      { searchLanguage: language, legacyDifficulty: difficulty, topics: "refresh" },
      trx,
    );
    for (const project of projects.values()) {
      await ProjectSearchMembership.firstOrCreate(
        { projectId: project.id, language, difficulty },
        {},
        { client: trx },
      );
    }
    return searchable.length;
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

export default new GitHubSyncService();
