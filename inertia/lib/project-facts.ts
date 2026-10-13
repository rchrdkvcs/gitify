import type {
  CommunityFiles,
  Difficulty,
  ProjectDetail,
  RepositoryInsights,
} from "../../shared/types/index.js";
import { issueKindForDifficulty, issueKindLabel } from "../../shared/issues.js";

export type CommitSeries = {
  weeks: number[];
  total: number;
  peak: number;
  activeWeeks: number;
};

export type HealthTier = "Excellente" | "Correcte" | "À améliorer";

export type ProjectHealth = { percentage: number; tier: HealthTier };

export type CommunityChecklistItem = { label: string; done: boolean };

export type ProjectCounts = {
  goodFirstIssues: number | null;
  helpWantedIssues: number | null;
  openIssues: number;
  closedIssues: number | null;
  openPullRequests: number | null;
  mergedPullRequests: number | null;
  contributors: number | null;
};

export type ProjectFacts = {
  difficultyLabel: string;
  counts: ProjectCounts;
  resolvedRate: number | null;
  commits: CommitSeries | null;
  recentCommits: CommitSeries | null;
  health: ProjectHealth | null;
  communityChecklist: CommunityChecklistItem[];
};

export type ProjectFactsSource = Pick<
  ProjectDetail,
  "difficulty" | "openIssuesCount" | "totalContributorsCount"
> & { insights: RepositoryInsights | null };

const recentWeekCount = 26;

const communityFileLabels: readonly { file: keyof CommunityFiles; label: string }[] = [
  { file: "readme", label: "README" },
  { file: "contributing", label: "Guide de contribution" },
  { file: "codeOfConduct", label: "Code de conduite" },
  { file: "license", label: "Licence" },
  { file: "issueTemplate", label: "Modèles d’issue" },
  { file: "pullRequestTemplate", label: "Modèle de pull request" },
];

export function difficultyLabel(difficulty: Difficulty): string {
  const kind = issueKindForDifficulty(difficulty);
  return issueKindLabel(kind === "all" ? "help-wanted" : kind);
}

export function commitSeries(weeks: readonly number[]): CommitSeries {
  return {
    weeks: [...weeks],
    total: weeks.reduce((sum, count) => sum + count, 0),
    peak: Math.max(1, ...weeks),
    activeWeeks: weeks.filter((count) => count > 0).length,
  };
}

export function resolvedRate(closed: number, open: number): number | null {
  const total = closed + open;
  return total > 0 ? Math.floor((closed / total) * 100) : null;
}

export function healthTier(percentage: number): HealthTier {
  if (percentage >= 80) return "Excellente";
  if (percentage >= 50) return "Correcte";
  return "À améliorer";
}

export function communityChecklist(files: CommunityFiles): CommunityChecklistItem[] {
  return communityFileLabels.map(({ file, label }) => ({ label, done: files[file] }));
}

export function projectFacts(project: ProjectFactsSource): ProjectFacts {
  const insights = project.insights;
  const weekly = insights?.weeklyCommits ?? null;
  const health = insights?.health ?? null;
  return {
    difficultyLabel: difficultyLabel(project.difficulty),
    counts: {
      goodFirstIssues: insights?.goodFirstIssues ?? null,
      helpWantedIssues: insights?.helpWantedIssues ?? null,
      openIssues: insights?.openIssues ?? project.openIssuesCount,
      closedIssues: insights?.closedIssues ?? null,
      openPullRequests: insights?.openPullRequests ?? null,
      mergedPullRequests: insights?.mergedPullRequests ?? null,
      contributors: project.totalContributorsCount,
    },
    resolvedRate: insights ? resolvedRate(insights.closedIssues, insights.openIssues) : null,
    commits: weekly ? commitSeries(weekly) : null,
    recentCommits: weekly ? commitSeries(weekly.slice(-recentWeekCount)) : null,
    health: health ? { percentage: health.percentage, tier: healthTier(health.percentage) } : null,
    communityChecklist: health ? communityChecklist(health.files) : [],
  };
}
