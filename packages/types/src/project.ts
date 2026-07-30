import type { Difficulty } from "./common.js";

export interface ShowcaseContributor {
  login: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface ShowcaseProject {
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
}

export interface ShowcaseLanguageResult {
  language: string;
  projects: ShowcaseProject[];
}

export interface Project {
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
}

export interface ProjectDetailContributor {
  id: string;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}

export interface ProjectDetail extends Project {
  readme: string | null;
  languages: Record<string, number> | null;
  forksCount: number;
  totalContributorsCount: number | null;
  latestRelease: string | null;
  createdAt: string;
  updatedAt: string;
  contributors: ProjectDetailContributor[];
}
