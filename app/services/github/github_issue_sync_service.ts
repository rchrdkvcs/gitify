import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import { ulid } from "ulid";
import type { GitHubAdapter, GitHubIssue } from "#services/github/github_adapter";
import type { IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import IssueSearchCache from "#models/issue_search_cache";
import IssueSearchMembership from "#models/issue_search_membership";
import ProjectIssue from "#models/project_issue";
import { upsertRepositories } from "#services/repository_identity";
import {
  type SearchFreshness,
  SearchFreshnessPolicy,
  type SnapshotRefresh,
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

export default class GitHubIssueSyncService {
  private readonly freshness: SearchFreshnessPolicy;

  constructor(
    private readonly github: GitHubAdapter,
    now: () => DateTime = () => DateTime.now(),
    freshness?: SearchFreshnessPolicy,
  ) {
    this.freshness = freshness ?? new SearchFreshnessPolicy(now);
  }

  async ensureIssuesFresh(criteria: IssueSearchCriteria): Promise<SearchFreshness> {
    return this.freshness.ensureFresh(this.refreshIssues(criteria));
  }

  async revalidateIssues(criteria: IssueSearchCriteria): Promise<SearchFreshness> {
    return this.freshness.revalidate(this.refreshIssues(criteria));
  }

  private refreshIssues(input: IssueSearchCriteria): SnapshotRefresh {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    return {
      key: `issue-search:${criteria.language}:${criteria.kind}`,
      ttlHours: gitifyConfig.cache.issueFetchTtlHours,
      store: issueSearchStore(criteria),
      importSnapshot: (trx) => this.importIssues(criteria, trx),
    };
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

    const projectIds = await upsertRepositories(
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
    if (issueLocks.size > 0) {
      await trx.rawQuery(
        "SELECT pg_advisory_xact_lock(hashtext(lock.key)) FROM unnest(?::text[]) WITH ORDINALITY AS lock(key, position) ORDER BY lock.position",
        [
          [...issueLocks]
            .sort((a, b) => a - b)
            .map((githubIssueId) => `project-issue:${githubIssueId}`),
        ],
      );
    }

    const uniqueIssues = [...new Map(issues.map((issue) => [issue.id, issue])).values()];
    if (uniqueIssues.length > 0) {
      const now = new Date();
      const stored: { id: string }[] = await trx
        .knexQuery()
        .table("project_issues")
        .insert(
          uniqueIssues.map((issue) => ({
            id: ulid(),
            github_issue_id: issue.id,
            project_id: projectIds.get(issue.repository.id)!,
            number: issue.number,
            title: issue.title,
            url: issue.url,
            labels: JSON.stringify(issue.labels),
            comments_count: issue.comments,
            assignees_count: issue.assignees,
            github_created_at: issue.createdAt,
            created_at: now,
            updated_at: now,
          })),
        )
        .onConflict("github_issue_id")
        .merge([
          "project_id",
          "number",
          "title",
          "url",
          "labels",
          "comments_count",
          "assignees_count",
          "github_created_at",
          "updated_at",
        ])
        .returning(["id"]);
      await trx
        .knexQuery()
        .table("issue_search_memberships")
        .insert(stored.map((issue) => ({ id: ulid(), issue_id: issue.id, language, kind })))
        .onConflict(["language", "kind", "issue_id"])
        .ignore();
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
