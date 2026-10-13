import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import type { GitHubAdapter, GitHubIssue } from "#services/github/github_adapter";
import type { IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import IssueSearchCache from "#models/issue_search_cache";
import IssueSearchMembership from "#models/issue_search_membership";
import ProjectIssue from "#models/project_issue";
import GitHubApiClient from "#services/github/github_api_client";
import { upsertRepositories } from "#services/repository_identity";
import {
  type SearchFreshness,
  SearchFreshnessPolicy,
  type SnapshotStore,
} from "#services/search_freshness/search_freshness";
import { issueKindCatalog } from "#shared/issues";

export type IssueSearchCriteria = {
  language: string;
  kind: IssueKind;
  token: string;
};

export function isContributable(issue: GitHubIssue): boolean {
  return (
    !issue.repository.isArchived && !issue.repository.isPrivate && issue.linkedPullRequests === 0
  );
}

export class GitHubIssueSyncService {
  private readonly freshness: SearchFreshnessPolicy;

  constructor(
    private readonly github: GitHubAdapter = GitHubApiClient,
    now: () => DateTime = () => DateTime.now(),
    freshness?: SearchFreshnessPolicy,
  ) {
    this.freshness = freshness ?? new SearchFreshnessPolicy(now);
  }

  async ensureIssuesFresh(input: IssueSearchCriteria): Promise<SearchFreshness> {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    return this.freshness.ensureFresh({
      key: `issue-search:${criteria.language}:${criteria.kind}`,
      ttlHours: gitifyConfig.cache.issueFetchTtlHours,
      store: issueSearchStore(criteria),
      importSnapshot: (trx) => this.importIssues(criteria, trx),
    });
  }

  private async importIssues(
    { language, kind, token }: IssueSearchCriteria,
    trx: TransactionClientContract,
  ): Promise<number> {
    const results = await this.github.searchIssues(
      language,
      kind,
      token,
      gitifyConfig.github.issues.searchPerPage,
    );
    const issues = results.filter(isContributable);

    const memberships = IssueSearchMembership.query({ client: trx })
      .where("language", language)
      .where("kind", kind);
    const previousMemberships = await memberships.clone().select("issueId");
    const previousIds = previousMemberships.map((membership) => membership.issueId);
    await memberships.delete();

    const projects = await upsertRepositories(
      issues.map((issue) => issue.repository),
      { searchLanguage: language, legacyDifficulty: legacyDifficultyFor(kind), topics: "keep" },
      trx,
    );

    const previous = previousIds.length
      ? await ProjectIssue.query({ client: trx }).whereIn("id", previousIds).select("githubIssueId")
      : [];
    const issueLocks = new Set([
      ...previous.map((issue) => Number(issue.githubIssueId)),
      ...issues.map((issue) => issue.id),
    ]);
    for (const githubIssueId of [...issueLocks].sort((a, b) => a - b)) {
      await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtext(?))", [
        `project-issue:${githubIssueId}`,
      ]);
    }

    for (const issue of issues) {
      const stored = await ProjectIssue.updateOrCreate(
        { githubIssueId: issue.id },
        {
          projectId: projects.get(issue.repository.id)!.id,
          number: issue.number,
          title: issue.title,
          url: issue.url,
          labels: issue.labels,
          commentsCount: issue.comments,
          assigneesCount: issue.assignees,
          githubCreatedAt: DateTime.fromISO(issue.createdAt),
        },
        { client: trx },
      );
      await IssueSearchMembership.firstOrCreate(
        { issueId: stored.id, language, kind },
        {},
        { client: trx },
      );
    }

    if (previousIds.length) {
      await ProjectIssue.query({ client: trx })
        .whereIn("id", previousIds)
        .whereNotExists((membership) => {
          membership
            .from("issue_search_memberships")
            .select("id")
            .whereColumn("issue_search_memberships.issue_id", "project_issues.id");
        })
        .delete();
    }
    return issues.length;
  }
}

function legacyDifficultyFor(kind: IssueKind) {
  return issueKindCatalog.find((entry) => entry.id === kind)?.difficulty ?? "expert";
}

function issueSearchStore({ language, kind }: IssueSearchCriteria): SnapshotStore {
  return {
    read: (trx) =>
      IssueSearchCache.query(trx ? { client: trx } : {})
        .where("language", language)
        .where("kind", kind)
        .first(),
    save: async (changes, trx) => {
      await IssueSearchCache.updateOrCreate({ language, kind }, changes, { client: trx });
    },
  };
}

export default new GitHubIssueSyncService();
