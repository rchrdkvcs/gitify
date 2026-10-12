import type { Difficulty } from "./common.js";

export type ShowcaseContributor = {
  login: string;
  avatarUrl: string;
  profileUrl: string;
};

export type ShowcaseProject = {
  id: string;
  name: string;
  ownerName: string;
  repositoryUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  latestRelease: string | null;
  updatedAt: string | null;
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
  description: string | null;
  repositoryUrl: string;
  stars: number;
  language: string | null;
  topics: string[] | null;
  openIssuesCount: number;
  difficulty: Difficulty;
  isFavorite: boolean;
  latestRelease: string | null;
  updatedAt: string | null;
};

export type ProjectDetailContributor = {
  id: string;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number | null;
};

export type ProjectDetail = Project & {
  readme: string | null;
  languages: Record<string, number> | null;
  forksCount: number;
  totalContributorsCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  contributors: ProjectDetailContributor[];
};
