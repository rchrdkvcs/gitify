import type { NewcomerScore, NewcomerSignalKey } from "./types/project.js";

export type NewcomerScoreTier = "excellent" | "good" | "fair" | "low";

export type NewcomerScoreTierEntry = {
  tier: NewcomerScoreTier;
  min: number;
  label: string;
  filterLabel: string | null;
};

export const newcomerScoreTiers: readonly NewcomerScoreTierEntry[] = [
  { tier: "excellent", min: 75, label: "Très accueillant", filterLabel: "Très accueillants" },
  { tier: "good", min: 50, label: "Accueillant", filterLabel: "Accueillants" },
  { tier: "fair", min: 25, label: "Peu outillé", filterLabel: null },
  { tier: "low", min: 0, label: "Difficile d’accès", filterLabel: null },
];

export function newcomerScoreTier(score: number): NewcomerScoreTierEntry {
  return newcomerScoreTiers.find((tier) => score >= tier.min) ?? newcomerScoreTiers.at(-1)!;
}

export const newcomerScoreSegmentCount = 10;

export type NewcomerScoreStatus = "pending" | "insufficient" | "archived" | "rated";

export type NewcomerScoreDescribable = Pick<NewcomerScore, "score" | "partial" | "archived"> &
  Partial<Pick<NewcomerScore, "coverage">>;

export type NewcomerScoreDisplay = {
  status: NewcomerScoreStatus;
  score: number | null;
  rated: boolean;
  archived: boolean;
  unrated: boolean;
  approximate: boolean;
  tier: NewcomerScoreTierEntry | null;
  label: string;
  statusLabel: string | null;
  title: string;
  note: string | null;
  filledSegments: number;
  filledRatio: number;
};

function statusOf(summary: NewcomerScoreDescribable | null | undefined): NewcomerScoreStatus {
  if (!summary) return "pending";
  if (summary.archived) return "archived";
  if (summary.score === null) return "insufficient";
  return "rated";
}

const unratedCopy = {
  pending: {
    title: "Score calculé à la première ouverture de la fiche du projet.",
    note: "Pas encore évalué : le score sera calculé à la prochaine actualisation du projet.",
  },
  insufficient: {
    title: "Pas assez de données GitHub pour évaluer ce projet pour l’instant.",
    note: "Pas assez de données GitHub pour évaluer ce projet pour l’instant.",
  },
} as const;

const archivedCopy = {
  label: "Archivé",
  statusLabel: "Dépôt archivé",
  note: "Un dépôt archivé n’accepte plus de contributions.",
} as const;

function partialNote(coverage: number | undefined) {
  if (coverage === undefined) return "Estimation sur une partie des signaux.";
  return `Estimation sur ${Math.round(coverage * 100)} % des signaux : certaines données GitHub manquent.`;
}

export function describeNewcomerScore(
  summary: NewcomerScoreDescribable | null | undefined,
): NewcomerScoreDisplay {
  const status = statusOf(summary);
  const base = {
    status,
    rated: false,
    archived: status === "archived",
    unrated: status === "pending" || status === "insufficient",
    approximate: false,
    tier: null,
    filledSegments: 0,
    filledRatio: 0,
  };

  if (status === "pending" || status === "insufficient") {
    const copy = unratedCopy[status];
    return {
      ...base,
      score: null,
      label: "Non évalué",
      statusLabel: null,
      title: copy.title,
      note: copy.note,
    };
  }

  if (status === "archived") {
    return {
      ...base,
      score: summary!.score,
      label: archivedCopy.label,
      statusLabel: archivedCopy.statusLabel,
      title: archivedCopy.statusLabel,
      note: archivedCopy.note,
    };
  }

  const score = Math.min(100, Math.max(0, summary!.score!));
  const approximate = summary!.partial;
  const tier = newcomerScoreTier(score);
  return {
    ...base,
    rated: true,
    score,
    approximate,
    tier,
    label: `${approximate ? "≈ " : ""}${score}/100`,
    statusLabel: tier.label,
    title: approximate ? `${tier.label}, estimation sur une partie des signaux` : tier.label,
    note: approximate ? partialNote(summary!.coverage) : null,
    filledSegments: Math.round((score / 100) * newcomerScoreSegmentCount),
    filledRatio: score / 100,
  };
}

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
