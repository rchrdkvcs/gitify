import type { RepositoryLabel } from "./project.js";

/** GitHub label families the issue feed searches for. */
export type IssueKind = "good-first-issue" | "help-wanted" | "documentation";

export type IssueSort = "recent" | "comments" | "stars";

export type IssueFilters = {
  q: string;
  languages: string[];
  kind: IssueKind | "all";
  /** Hide issues someone is already assigned to. */
  unassigned: boolean;
  sort: IssueSort;
};

/** Repository summary displayed next to an issue. */
export type IssueProject = {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatarUrl: string;
  language: string | null;
  stars: number;
};

export type FeedIssue = {
  id: string;
  number: number;
  title: string;
  url: string;
  createdAt: string | null;
  comments: number;
  labels: RepositoryLabel[];
  isAssigned: boolean;
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
  project: IssueProject;
};
