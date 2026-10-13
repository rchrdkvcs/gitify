import type {
  NewcomerScore,
  NewcomerSignal,
  NewcomerSignalKey,
  RepositoryInsights,
} from "./types/project.js";

/**
 * Newcomer-friendliness score ("score d'accueil des débutants").
 *
 * Each signal is normalised to a ratio between 0 and 1, then weighted. Weights sum to 100.
 * Unknown signals are left out and the score is rescaled over the known weight, so a missing
 * statistic lowers the confidence (`partial`, `coverage`) instead of the score itself. Below
 * `minimumCoverage` the score is withheld. Archived repositories always score 0.
 */
export const newcomerScoreWeights: Record<NewcomerSignalKey, number> = {
  firstResponse: 25,
  externalMergeRate: 20,
  goodFirstIssues: 20,
  communityProfile: 15,
  maintainerActivity: 20,
};

export const newcomerScoreRules = {
  minimumCoverage: 0.5,
  /** A first answer within a day is ideal; a month or more earns nothing (log scale between). */
  firstResponseHours: { ideal: 24, worst: 24 * 30 },
  /** Merge rate earning every point; fewer decided PRs than `minimumDecided` is unknown. */
  externalMergeRate: { full: 0.8, minimumDecided: 3 },
  /** Unassigned good first issues earning every point. */
  goodFirstIssues: { full: 5 },
  /** Share of the community profile signal brought by each file. */
  communityFiles: {
    contributing: 0.4,
    issueTemplate: 0.25,
    codeOfConduct: 0.2,
    pullRequestTemplate: 0.15,
  },
  /** Days since the latest commit or merged PR: full points up to `ideal`, none from `worst`. */
  maintainerActivityDays: { ideal: 14, worst: 365 },
} as const;

/** Raw facts the score is computed from, independent of where they were collected. */
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

/** Pure computation: same input and clock, same score. */
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

/** Maps a stored GitHub snapshot onto score inputs; older snapshots simply lack some signals. */
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

export type NewcomerScoreTier = "excellent" | "good" | "fair" | "low";

export const newcomerScoreTiers: { tier: NewcomerScoreTier; min: number; label: string }[] = [
  { tier: "excellent", min: 75, label: "Très accueillant" },
  { tier: "good", min: 50, label: "Accueillant" },
  { tier: "fair", min: 25, label: "Peu outillé" },
  { tier: "low", min: 0, label: "Difficile d’accès" },
];

export function newcomerScoreTier(score: number) {
  return newcomerScoreTiers.find((tier) => score >= tier.min) ?? newcomerScoreTiers.at(-1)!;
}

/** Public wording of each signal, shared by the project page and the catalogue. */
export const newcomerSignalCatalog: Record<
  NewcomerSignalKey,
  { label: string; description: string; format: (value: number) => string }
> = {
  firstResponse: {
    label: "Première réponse",
    description:
      "Délai médian avant qu’un mainteneur réponde à une issue ou une PR ouverte par une personne extérieure.",
    format: (hours) =>
      hours < 1
        ? "moins d’une heure"
        : hours < 48
          ? `${Math.round(hours)} h`
          : `${Math.round(hours / 24)} jours`,
  },
  externalMergeRate: {
    label: "PR externes fusionnées",
    description:
      "Part des pull requests de contributeurs extérieurs fusionnées, parmi les plus récentes déjà tranchées.",
    format: (rate) => `${Math.round(rate * 100)} %`,
  },
  goodFirstIssues: {
    label: "Issues pour débuter",
    description:
      "Issues « good first issue » ouvertes et encore libres (personne n’y est assigné).",
    format: (count) => (count === 1 ? "1 libre" : `${count} libres`),
  },
  communityProfile: {
    label: "Guide du contributeur",
    description:
      "Présence d’un CONTRIBUTING, de modèles d’issue et de PR et d’un code de conduite.",
    format: (count) => `${count} fichier${count > 1 ? "s" : ""} sur 4`,
  },
  maintainerActivity: {
    label: "Activité des mainteneurs",
    description: "Temps écoulé depuis le dernier commit ou la dernière PR fusionnée.",
    format: (days) =>
      days < 1 ? "aujourd’hui" : days === 1 ? "il y a 1 jour" : `il y a ${days} jours`,
  },
};

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
