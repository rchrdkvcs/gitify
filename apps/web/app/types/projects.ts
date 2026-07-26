export interface Project {
  id: string;
  name: string;
  ownerName: string;
  repositoryUrl: string;
  description: string | null;
  language: string;
  stars: number;
  latestRelease: string | null;
  updatedAt: string;
  topics: string[];
  totalContributorsCount: number | null;
  contributors: any[];
}

export interface ProjectGroup {
  language: string;
  projects: Project[];
}
