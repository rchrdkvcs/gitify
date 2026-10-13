import type {
  NewcomerScore,
  NewcomerSignal,
  NewcomerSignalKey,
  RepositoryInsights,
} from "./types/project.js";
import { newcomerScoreRules, newcomerScoreWeights } from "./newcomer_score_rules.js";

export type NewcomerScoreInput = {
  isArchived: boolean;
  medianFirstResponseHours: number | null;
  externalPullRequests: { merged: number; closed: number } | null;
  unassignedGoodFirstIssues: number | null;
  communityFiles: {
    contributing: boolean;
    issueTemplate: boolean;
    codeOfConduct: boolean;
    pullRequestTemplate: boolean;
  } | null;
  lastCommitAt: string | null;
  lastMergedPullRequestAt: string | null;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function measure(input: NewcomerScoreInput, now: Date) {
  const rules = newcomerScoreRules;
  const measures: Record<NewcomerSignalKey, { value: number | null; ratio: number | null }> = {
    firstResponse: { value: null, ratio: null },
    externalMergeRate: { value: null, ratio: null },
    goodFirstIssues: { value: null, ratio: null },
    communityProfile: { value: null, ratio: null },
    maintainerActivity: { value: null, ratio: null },
  };

  const hours = input.medianFirstResponseHours;
  if (hours !== null && Number.isFinite(hours) && hours >= 0) {
    const { ideal, worst } = rules.firstResponseHours;
    measures.firstResponse = {
      value: hours,
      ratio: hours <= ideal ? 1 : clamp(1 - Math.log(hours / ideal) / Math.log(worst / ideal)),
    };
  }

  const prs = input.externalPullRequests;
  const decided = prs ? prs.merged + prs.closed : 0;
  if (prs && decided >= rules.externalMergeRate.minimumDecided) {
    const rate = prs.merged / decided;
    measures.externalMergeRate = {
      value: rate,
      ratio: clamp(rate / rules.externalMergeRate.full),
    };
  }

  const issues = input.unassignedGoodFirstIssues;
  if (issues !== null && issues >= 0) {
    measures.goodFirstIssues = {
      value: issues,
      ratio: clamp(issues / rules.goodFirstIssues.full),
    };
  }

  const files = input.communityFiles;
  if (files) {
    const shares = rules.communityFiles;
    const present = (Object.keys(shares) as (keyof typeof shares)[]).filter((file) => files[file]);
    measures.communityProfile = {
      value: present.length,
      ratio: clamp(present.reduce((sum, file) => sum + shares[file], 0)),
    };
  }

  const latest = [input.lastCommitAt, input.lastMergedPullRequestAt]
    .map((iso) => (iso ? Date.parse(iso) : Number.NaN))
    .filter((time) => Number.isFinite(time));
  if (latest.length) {
    const days = Math.max(0, (now.getTime() - Math.max(...latest)) / 86_400_000);
    const { ideal, worst } = rules.maintainerActivityDays;
    measures.maintainerActivity = {
      value: Math.floor(days),
      ratio: days <= ideal ? 1 : clamp(1 - (days - ideal) / (worst - ideal)),
    };
  }

  return measures;
}

export function computeNewcomerScore(input: NewcomerScoreInput, now: Date): NewcomerScore {
  const measures = measure(input, now);
  const signals: NewcomerSignal[] = (Object.keys(newcomerScoreWeights) as NewcomerSignalKey[]).map(
    (key) => {
      const weight = newcomerScoreWeights[key];
      const { value, ratio } = measures[key];
      return {
        key,
        weight,
        value,
        ratio: ratio === null ? null : round(ratio, 3),
        points: ratio === null ? null : round(ratio * weight, 1),
      };
    },
  );

  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const known = signals.filter((signal) => signal.ratio !== null);
  const knownWeight = known.reduce((sum, signal) => sum + signal.weight, 0);
  const coverage = round(knownWeight / totalWeight, 3);
  const earned = known.reduce((sum, signal) => sum + signal.ratio! * signal.weight, 0);

  let score: number | null = null;
  if (input.isArchived) {
    score = 0;
  } else if (coverage >= newcomerScoreRules.minimumCoverage) {
    score = Math.round((100 * earned) / knownWeight);
  }

  return {
    version: 1,
    score,
    partial: !input.isArchived && coverage < 1,
    coverage,
    archived: input.isArchived,
    signals,
    computedAt: now.toISOString(),
  };
}

export function newcomerScoreInputFromInsights(
  insights: RepositoryInsights,
  fallbackPushedAt: string | null = null,
): NewcomerScoreInput {
  const activity = insights.contributorActivity ?? null;
  const files = insights.health?.files ?? null;
  return {
    isArchived: insights.isArchived,
    medianFirstResponseHours: activity?.medianFirstResponseHours ?? null,
    externalPullRequests: activity
      ? {
          merged: activity.externalPullRequestsMerged,
          closed: activity.externalPullRequestsClosed,
        }
      : null,
    unassignedGoodFirstIssues: activity?.unassignedGoodFirstIssues ?? null,
    communityFiles: files
      ? {
          contributing: files.contributing,
          issueTemplate: files.issueTemplate,
          codeOfConduct: files.codeOfConduct,
          pullRequestTemplate: files.pullRequestTemplate,
        }
      : null,
    lastCommitAt: insights.lastCommitAt ?? fallbackPushedAt,
    lastMergedPullRequestAt: activity?.lastMergedPullRequestAt ?? null,
  };
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
