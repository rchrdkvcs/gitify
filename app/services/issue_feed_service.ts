import type {
  FeedIssue,
  FeedRefreshState,
  IssueFilters,
  IssueKind,
  PaginationMeta,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import ProjectIssue from "#models/project_issue";
import issueSync, { type GitHubIssueSyncService } from "#services/github/github_issue_sync_service";
import { issueKinds } from "#shared/issues";
import { normalizePage } from "#shared/pagination";
import IssueTransformer from "#transformers/issue_transformer";

/** Cross-repository feed of issues open to a first contribution. */
export class IssueFeedService {
  constructor(private readonly sync: GitHubIssueSyncService = issueSync) {}

  /** Only the first page may refresh GitHub searches for the selected languages and kinds. */
  async explore(
    filters: IssueFilters,
    requestedPage: unknown,
    reader: { token: string | null },
  ): Promise<{ issues: FeedIssue[]; meta: PaginationMeta; refreshState: FeedRefreshState }> {
    const page = normalizePage(requestedPage);
    const kinds: IssueKind[] = filters.kind === "all" ? issueKinds : [filters.kind];

    const refreshes =
      page === 1 && reader.token
        ? await Promise.allSettled(
            filters.languages.flatMap((language) =>
              kinds.map((kind) =>
                this.sync.ensureIssuesFresh({ language, kind, token: reader.token! }),
              ),
            ),
          )
        : [];

    const query = issuesForSearch(
      filters.languages,
      filters.kind === "all" ? undefined : filters.kind,
    )
      .join("projects", "projects.id", "project_issues.project_id")
      .select("project_issues.*")
      .preload("project");
    if (filters.unassigned) {
      query.where("project_issues.assignees_count", 0);
    }
    const search = filters.q.trim();
    if (search) {
      const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      query.where((builder) => {
        builder
          .whereILike("project_issues.title", pattern)
          .orWhereILike("projects.name", pattern)
          .orWhereILike("projects.owner_name", pattern);
      });
    }
    if (filters.sort === "comments") {
      // Least discussed first: nobody has started the conversation yet.
      query.orderBy("project_issues.comments_count", "asc");
    } else if (filters.sort === "stars") {
      query.orderBy("projects.stars", "desc");
    }
    query.orderByRaw("project_issues.github_created_at DESC NULLS LAST");
    const paginator = await query
      .orderBy("project_issues.id", "asc")
      .paginate(page, gitifyConfig.issues.pageSize);

    const failed = refreshes.some((refresh) => refresh.status === "rejected");
    const refreshing = refreshes.some(
      (refresh) => refresh.status === "fulfilled" && refresh.value.status === "pending",
    );
    const refreshState: FeedRefreshState = failed
      ? paginator.total > 0
        ? "degraded"
        : "unavailable"
      : refreshing
        ? "refreshing"
        : "ready";

    return {
      issues: paginator.all().map((issue) => new IssueTransformer(issue).toObject()),
      meta: {
        total: paginator.total,
        perPage: paginator.perPage,
        currentPage: paginator.currentPage,
        lastPage: Math.max(1, paginator.lastPage),
      },
      refreshState,
    };
  }
}

export default new IssueFeedService();

/** Issues listed by at least one matching search; no language means every language. */
export function issuesForSearch(languages: string[], kind?: IssueKind) {
  return ProjectIssue.query().whereExists((membership) => {
    membership
      .from("issue_search_memberships")
      .select("id")
      .whereColumn("issue_search_memberships.issue_id", "project_issues.id");
    if (languages.length) {
      membership.whereIn(
        "issue_search_memberships.language",
        languages.map((language) => language.toLowerCase()),
      );
    }
    if (kind) {
      membership.where("issue_search_memberships.kind", kind);
    }
  });
}
