import type { Difficulty, ExploreSort } from "@shared/types/index";
import { newcomerScoreTiers } from "@shared/newcomer_score_display";
import type { FeedStatusCopy } from "~/components/feed/FeedStatus.vue";

export const exploreMinScoreItems: { label: string; value: number }[] = [
  { label: "Tout accueil", value: 0 },
  ...newcomerScoreTiers
    .filter((tier) => tier.filterLabel !== null)
    .map((tier) => ({ label: `${tier.filterLabel} (${tier.min}+)`, value: tier.min }))
    .reverse(),
];

export const exploreLevelItems: { label: string; value: Difficulty | "all" }[] = [
  { label: "Tous niveaux", value: "all" },
  { label: "Débutant", value: "beginner" },
  { label: "Confirmé", value: "expert" },
];

export const exploreSortItems: { label: string; value: ExploreSort }[] = [
  { label: "Plus d’étoiles", value: "stars" },
  { label: "Activité récente", value: "recent" },
  { label: "Plus d’issues", value: "issues" },
  { label: "Plus accueillants", value: "welcome" },
];

export const exploreStatusCopy: FeedStatusCopy = {
  degraded:
    "Certains projets n’ont pas pu être actualisés. Tu peux explorer ceux déjà disponibles.",
  refreshing: "Une partie du catalogue sera actualisée au prochain chargement.",
  unavailable: {
    title: "Les projets sont momentanément indisponibles",
    description: "Impossible de récupérer les projets. Réessaie dans quelques instants.",
  },
  preparing: {
    icon: "lucide:folder-search",
    title: "Le catalogue se prépare",
    description:
      "On récupère des projets depuis GitHub pour ces langages. Recharge la page dans quelques instants.",
  },
};
