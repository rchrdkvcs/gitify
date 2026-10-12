import type { Difficulty } from "./common.js";

export type FeedRefreshState = "ready" | "refreshing" | "degraded" | "unavailable";

export type ShowcaseContributor = {
  login: string;
  avatarUrl: string;
  profileUrl: string;
};

export type ShowcaseProject = {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatarUrl: string;
  repositoryUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  latestRelease: string | null;
  pushedAt: string | null;
  topics: string[];
  totalContributorsCount: number | null;
  contributors: ShowcaseContributor[];
};

export type ShowcaseLanguageResult = {
  language: string;
  projects: ShowcaseProject[];
};

export type Project = {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatarUrl: string;
  description: string | null;
  repositoryUrl: string;
  stars: number;
  forksCount: number;
  language: string | null;
  topics: string[] | null;
  openIssuesCount: number;
  difficulty: Difficulty;
  isFavorite: boolean;
  latestRelease: string | null;
  pushedAt: string | null;
  /** Newcomer-friendliness; null until the repository details have been fetched once. */
  newcomerScore: NewcomerScoreSummary | null;
};

export type ProjectDetailContributor = {
  id: string;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number | null;
};

export type RepositoryLabel = { name: string; color: string };

export type RepositoryActor = { login: string; avatarUrl: string } | null;

export type RepositoryIssue = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  author: RepositoryActor;
  comments: number;
  labels: RepositoryLabel[];
};

export type RepositoryPullRequest = RepositoryIssue & { isDraft: boolean };

export type RepositoryLanguage = { name: string; color: string | null; bytes: number };

/** Community files GitHub checks for its community profile. */
export type CommunityFiles = {
  readme: boolean;
  contributing: boolean;
  codeOfConduct: boolean;
  license: boolean;
  issueTemplate: boolean;
  pullRequestTemplate: boolean;
};

/**
 * How maintainers treat outside contributors, summarised from the most recent issues and
 * pull requests. Counts exclude maintainers (owner, members, collaborators) and bots.
 */
export type ContributorActivity = {
  /** External issues and PRs old enough to expect an answer. */
  sampledItems: number;
  /** Among them, those that received a maintainer comment, review or merge. */
  respondedItems: number;
  /** Median hours until that first answer; unanswered items count with their age. */
  medianFirstResponseHours: number | null;
  externalPullRequestsMerged: number;
  /** Closed without being merged. */
  externalPullRequestsClosed: number;
  lastMergedPullRequestAt: string | null;
  /** Open "good first issue" issues nobody is assigned to, among the latest 20. */
  unassignedGoodFirstIssues: number;
};

/** Repository snapshot refreshed together with the README and contributors. */
export type RepositoryInsights = {
  watchers: number;
  openIssues: number;
  closedIssues: number;
  openPullRequests: number;
  mergedPullRequests: number;
  goodFirstIssues: number;
  helpWantedIssues: number;
  commits: number | null;
  releases: number;
  latestReleaseAt: string | null;
  diskUsageKb: number | null;
  defaultBranch: string | null;
  isArchived: boolean;
  lastCommitAt: string | null;
  languages: RepositoryLanguage[];
  /** Commits per week over the last year, oldest first; null while GitHub computes it. */
  weeklyCommits: number[] | null;
  health: { percentage: number; files: CommunityFiles } | null;
  issues: RepositoryIssue[];
  beginnerIssues: RepositoryIssue[];
  pullRequests: RepositoryPullRequest[];
  /** Absent from snapshots taken before contributor activity was collected. */
  contributorActivity?: ContributorActivity | null;
};

export type NewcomerSignalKey =
  | "firstResponse"
  | "externalMergeRate"
  | "goodFirstIssues"
  | "communityProfile"
  | "maintainerActivity";

export type NewcomerSignal = {
  key: NewcomerSignalKey;
  /** Maximum points this signal brings to a complete score. */
  weight: number;
  /** Measured value in the signal's unit (hours, ratio, count, days); null when unknown. */
  value: number | null;
  /** Normalised quality between 0 and 1; null when unknown. */
  ratio: number | null;
  /** Points earned out of `weight`; null when unknown. */
  points: number | null;
};

/** Persisted score with its breakdown. */
export type NewcomerScore = {
  version: 1;
  /** 0 to 100, computed over the known signals only; null when too few are known. */
  score: number | null;
  /** True when some signals are unknown: the score is an estimate over the others. */
  partial: boolean;
  /** Share of the total weight backed by data, between 0 and 1. */
  coverage: number;
  archived: boolean;
  signals: NewcomerSignal[];
  computedAt: string;
};

export type NewcomerScoreSummary = Pick<NewcomerScore, "score" | "partial" | "archived">;

export type ProjectDetail = Project & {
  readme: string | null;
  contributing: string | null;
  homepageUrl: string | null;
  license: string | null;
  totalContributorsCount: number | null;
  githubCreatedAt: string | null;
  detailsFetchedAt: string | null;
  insights: RepositoryInsights | null;
  newcomerScoreDetails: NewcomerScore | null;
  contributors: ProjectDetailContributor[];
};

export type ExploreSort = "stars" | "recent" | "issues" | "welcome";

export type ExploreFilters = {
  q: string;
  /** Exact GitHub topic, e.g. `react`. */
  topic: string | null;
  languages: string[];
  level: Difficulty | "all";
  sort: ExploreSort;
  /** Minimum newcomer score; null shows every repository, scored or not. */
  minScore: number | null;
};
