import type { Difficulty } from "./common.js";
import type { PreferenceLanguage } from "./user.js";

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

export type CommunityFiles = {
  readme: boolean;
  contributing: boolean;
  codeOfConduct: boolean;
  license: boolean;
  issueTemplate: boolean;
  pullRequestTemplate: boolean;
};

export type ContributorActivity = {
  sampledItems: number;
  respondedItems: number;
  medianFirstResponseHours: number | null;
  externalPullRequestsMerged: number;
  externalPullRequestsClosed: number;
  lastMergedPullRequestAt: string | null;
  unassignedGoodFirstIssues: number;
};

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
  weeklyCommits: number[] | null;
  health: { percentage: number; files: CommunityFiles } | null;
  issues: RepositoryIssue[];
  beginnerIssues: RepositoryIssue[];
  pullRequests: RepositoryPullRequest[];
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
  weight: number;
  value: number | null;
  ratio: number | null;
  points: number | null;
};

export type NewcomerScore = {
  version: 1;
  score: number | null;
  partial: boolean;
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
  topic: string | null;
  languages: PreferenceLanguage[];
  level: Difficulty | "all";
  sort: ExploreSort;
  minScore: number | null;
};
