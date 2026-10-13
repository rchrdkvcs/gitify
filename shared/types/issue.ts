import type { issueKindCatalog } from "../issues.js";
import type { RepositoryLabel } from "./project.js";
import type { PreferenceLanguage } from "./user.js";

export type IssueKind = (typeof issueKindCatalog)[number]["id"];

export type IssueSort = "recent" | "comments" | "stars";

export type IssueFilters = {
  q: string;
  languages: PreferenceLanguage[];
  kind: IssueKind | "all";
  unassigned: boolean;
  sort: IssueSort;
};

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
