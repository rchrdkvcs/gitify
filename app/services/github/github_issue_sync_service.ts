import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import type { GitHubAdapter, GitHubIssue } from "#services/github/github_adapter";
import type { IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import IssueSearchCache from "#models/issue_search_cache";
import IssueSearchMembership from "#models/issue_search_membership";
import Project from "#models/project";
import ProjectIssue from "#models/project_issue";
import GitHubApiClient from "#services/github/github_api_client";
import {
  type SearchFreshness,
  SearchRetryDeferredError,
  releaseSearchPermit,
  tryAcquireSearchPermit,
} from "#services/github/github_sync_service";

export type IssueSearchCriteria = {
  language: string;
  kind: IssueKind;
  token: string;
};

/** Contributable issues only: public, active repositories, and nobody has opened the fix yet. */
export function isContributable(issue: GitHubIssue): boolean {
  return (
    !issue.repository.isArchived && !issue.repository.isPrivate && issue.linkedPullRequests === 0
  );
}

/**
 * Issue snapshots follow the repository search policy: a TTL checked under a PostgreSQL
 * advisory lock, the shared remote search budget and a retry cooldown after failures.
 */
export class GitHubIssueSyncService {
  constructor(
    private readonly github: GitHubAdapter = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  async ensureIssuesFresh(input: IssueSearchCriteria): Promise<SearchFreshness> {
    const criteria = { ...input, language: input.language.trim().toLowerCase() };
    const cache = await this.readCache(criteria);
    if (this.isFresh(cache)) {
      return { status: "fresh" };
    }
    this.assertRetryAllowed(cache);
    if (!tryAcquireSearchPermit()) {
      return { status: "pending" };
    }
    try {
      return await db.transaction(async (trx) => {
        if (!(await this.tryLock(criteria, trx))) {
          return { status: "pending" };
        }
        const current = await this.readCache(criteria, trx);
        if (this.isFresh(current)) {
          return { status: "fresh" };
        }
        this.assertRetryAllowed(current);
        const totalStored = await this.importIssues(criteria, trx);
        return { status: "refreshed", totalStored };
      });
    } catch (error) {
      // The failed import has rolled back: the previous snapshot stays visible.
      if (!(error instanceof SearchRetryDeferredError)) {
        await this.recordFailure(criteria);
      }
      throw error;
    } finally {
      releaseSearchPermit();
    }
  }

  private isFresh(cache: IssueSearchCache | null): boolean {
    return (
      !!cache?.fetchedAt &&
      this.now().diff(cache.fetchedAt, "hours").hours < gitifyConfig.cache.issueFetchTtlHours
    );
  }

  private assertRetryAllowed(cache: IssueSearchCache | null): void {
    if (cache?.retryAfter && cache.retryAfter.toMillis() > this.now().toMillis()) {
      throw new SearchRetryDeferredError();
    }
  }

  private async readCache(criteria: IssueSearchCriteria, trx?: TransactionClientContract) {
    return IssueSearchCache.query(trx ? { client: trx } : {})
      .where("language", criteria.language)
      .where("kind", criteria.kind)
      .first();
  }

  private async tryLock(criteria: IssueSearchCriteria, trx: TransactionClientContract) {
    const lock = await trx.rawQuery("SELECT pg_try_advisory_xact_lock(hashtext(?)) AS acquired", [
      `issue-search:${criteria.language}:${criteria.kind}`,
    ]);
    return lock.rows[0].acquired as boolean;
  }

  private async recordFailure(criteria: IssueSearchCriteria): Promise<void> {
    await db.transaction(async (trx) => {
      // Another process owns this criterion and will publish its own outcome.
      if (!(await this.tryLock(criteria, trx))) {
        return;
      }
      const current = await this.readCache(criteria, trx);
      if (this.isFresh(current)) {
        return;
      }
      const retryAfter = this.now().plus({ seconds: gitifyConfig.cache.searchRetrySeconds });
      if (current) {
        current.retryAfter = retryAfter;
        await current.save();
      } else {
        await IssueSearchCache.create(
          {
            language: criteria.language,
            kind: criteria.kind,
            fetchedAt: null,
            totalStored: 0,
            retryAfter,
          },
          { client: trx },
        );
      }
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

    // Same identity lock as repository imports, taken in a fixed order.
    const repositories = new Map(issues.map((issue) => [issue.repository.id, issue.repository]));
    const projectIds = new Map<number, string>();
    for (const repo of [...repositories.values()].sort((a, b) => a.id - b.id)) {
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
        openIssuesCount: repo.openIssuesCount,
        language: repo.language?.toLowerCase() ?? language,
        ownerAvatarUrl: repo.ownerAvatarUrl,
        homepageUrl: repo.homepageUrl,
        license: repo.license,
        pushedAt: repo.pushedAt ? DateTime.fromISO(repo.pushedAt) : null,
        githubCreatedAt: repo.createdAt ? DateTime.fromISO(repo.createdAt) : null,
      };
      // Topics are truncated in issue results: only a new repository takes them.
      const project = await Project.firstOrCreate(
        { githubRepoId: repo.id },
        {
          ...metadata,
          topics: repo.topics,
          difficulty: kind === "good-first-issue" ? "beginner" : "expert",
        },
        { client: trx },
      );
      project.merge(metadata);
      await project.save();
      projectIds.set(repo.id, project.id);
    }

    // Lock every issue this criterion touches, previous ones included, so a concurrent
    // criterion never re-attaches an issue while its orphan row is being removed.
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
          projectId: projectIds.get(issue.repository.id)!,
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

    // Issues no search still lists (closed, taken or aged out) leave the table.
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

    await IssueSearchCache.updateOrCreate(
      { language, kind },
      { totalStored: issues.length, fetchedAt: this.now(), retryAfter: null },
      { client: trx },
    );
    return issues.length;
  }
}

export default new GitHubIssueSyncService();
