import { DateTime } from "luxon";
import type { IssueFilters } from "#shared/types/index";
import { IssueFeed } from "#services/feeds/issue_feed";
import { GitHubIssueSyncService } from "#services/github/github_issue_sync_service";
import { FakeGitHubAdapter } from "#tests/helpers/fake_github_adapter";

export const issueFeedNow = DateTime.fromISO("2026-10-12T12:00:00Z");

export function issueFilters(overrides: Partial<IssueFilters> = {}): IssueFilters {
  return {
    q: "",
    languages: ["typescript"],
    kind: "good-first-issue",
    unassigned: true,
    sort: "recent",
    ...overrides,
  };
}

export function issueFeedSetup(now: DateTime = issueFeedNow) {
  const github = new FakeGitHubAdapter();
  const clock = { now };
  const sync = new GitHubIssueSyncService(github, () => clock.now);
  return { github, clock, sync, feed: new IssueFeed(sync) };
}
