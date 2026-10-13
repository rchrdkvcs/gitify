import type {
  FeedIssue,
  FeedRefreshState,
  IssueFilters,
  IssueKind,
  PaginationMeta,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import ProjectIssue from "#models/project_issue";
import { cachedFeedPage, type SearchRefresh } from "#services/feeds/cached_feed_page";
import { containsPattern } from "#services/feeds/feed_query";
import issueSync, { type GitHubIssueSyncService } from "#services/github/github_issue_sync_service";
import { issueKinds } from "#shared/issues";
import { normalizePage } from "#shared/pagination";
import IssueTransformer from "#transformers/issue_transformer";

type IssueSync = Pick<GitHubIssueSyncService, "ensureIssuesFresh">;

export type IssuePage = {
  issues: FeedIssue[];
  meta: PaginationMeta;
  refreshState: FeedRefreshState;
};

export class IssueFeed {
  constructor(private readonly sync: IssueSync = issueSync) {}

  async explore(
    filters: IssueFilters,
    requestedPage: unknown,
    reader: { token: string | null },
  ): Promise<IssuePage> {
    const { items, meta, refreshState } = await cachedFeedPage({
      refreshes: this.refreshes(filters, reader.token),
      query: this.query(filters),
      page: normalizePage(requestedPage),
      perPage: gitifyConfig.issues.pageSize,
    });
    return {
      issues: items.map((issue) => new IssueTransformer(issue).toObject()),
      meta,
      refreshState,
    };
  }

  private refreshes(filters: IssueFilters, token: string | null): SearchRefresh[] {
    if (!token) {
      return [];
    }
    const kinds: IssueKind[] = filters.kind === "all" ? issueKinds : [filters.kind];
    return filters.languages.flatMap((language) =>
      kinds.map((kind) => () => this.sync.ensureIssuesFresh({ language, kind, token })),
    );
  }

  private query(filters: IssueFilters) {
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
      const pattern = containsPattern(search);
      query.where((builder) => {
        builder
          .whereILike("project_issues.title", pattern)
          .orWhereILike("projects.name", pattern)
          .orWhereILike("projects.owner_name", pattern);
      });
    }
    if (filters.sort === "comments") {
      query.orderBy("project_issues.comments_count", "asc");
    } else if (filters.sort === "stars") {
      query.orderBy("projects.stars", "desc");
    }
    return query
      .orderByRaw("project_issues.github_created_at DESC NULLS LAST")
      .orderBy("project_issues.id", "asc");
  }
}

export default new IssueFeed();

function issuesForSearch(languages: string[], kind?: IssueKind) {
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
