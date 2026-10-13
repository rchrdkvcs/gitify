<script setup lang="ts">
import type {
  Difficulty,
  ExploreFilters,
  ExploreSort,
  FeedRefreshState,
  PaginationMeta,
  Project,
} from "@shared/types/index";
import { Head } from "@inertiajs/vue3";
import { newcomerScoreTiers } from "@shared/newcomer_score_display";
import type { FeedStatusCopy } from "~/components/feed/FeedStatus.vue";
import { exploreFilterSchema } from "~/lib/feed-filter-schemas";

const props = defineProps<{
  projects: { data: Project[]; meta: PaginationMeta };
  total: number;
  filters: ExploreFilters;
  topicOptions: string[];
  preferredTopics?: string[];
  languageOptions: { value: string; label: string; icon: string }[];
  refreshState: FeedRefreshState;
}>();

const minScoreItems: { label: string; value: number }[] = [
  { label: "Tout accueil", value: 0 },
  ...newcomerScoreTiers
    .filter((tier) => tier.filterLabel !== null)
    .map((tier) => ({ label: `${tier.filterLabel} (${tier.min}+)`, value: tier.min }))
    .reverse(),
];

const levelItems: { label: string; value: Difficulty | "all" }[] = [
  { label: "Tous niveaux", value: "all" },
  { label: "Débutant", value: "beginner" },
  { label: "Confirmé", value: "expert" },
];

const sortItems: { label: string; value: ExploreSort }[] = [
  { label: "Plus d’étoiles", value: "stars" },
  { label: "Activité récente", value: "recent" },
  { label: "Plus d’issues", value: "issues" },
  { label: "Plus accueillants", value: "welcome" },
];

const statusCopy: FeedStatusCopy = {
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

const { filters, hasActiveFilters, reload, resetFilters } = useFilteredFeed({
  schema: exploreFilterSchema,
  source: props.filters,
  debounced: ["q"],
  visit: inertiaFeedVisit("/explore", {
    scroll: "projects",
    dependents: ["total", "filters", "topicOptions", "refreshState"],
  }),
});

const { withFavorite, setFavorite } = useFavoriteOverrides();
const projectCards = computed(() => props.projects.data.map(withFavorite));

const resultLabel = computed(() =>
  props.total === 1 ? "1 projet" : `${props.total.toLocaleString("fr-FR")} projets`,
);

const relaxations = computed(() =>
  [
    filters.minScore > 0 && { label: "Tout accueil", apply: () => (filters.minScore = 0) },
    filters.languages.length > 0 && {
      label: "Tous les langages",
      apply: () => (filters.languages = []),
    },
    filters.level !== "all" && { label: "Tous niveaux", apply: () => (filters.level = "all") },
    filters.topic && { label: `Sans #${filters.topic}`, apply: () => (filters.topic = null) },
    filters.q.trim() && { label: "Effacer la recherche", apply: () => (filters.q = "") },
  ].filter((item) => !!item),
);
</script>

<template>
  <Head title="Explorer">
    <meta
      name="description"
      content="Parcours des projets open source GitHub par langage et par niveau, avec leurs issues prêtes à être prises."
    />
  </Head>

  <OnboardingReminder />

  <FrameSection inner-class="px-4 py-12 sm:px-8 sm:py-16">
    <div class="flex max-w-3xl flex-col gap-6">
      <p class="eyebrow">
        <span class="size-1.5 bg-primary" aria-hidden="true" />
        Catalogue
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-5xl">
        Trouve ton prochain projet open source.
      </h1>

      <FeedSearchInput
        v-model="filters.q"
        size="xl"
        placeholder="Nom, propriétaire, description ou sujet…"
        aria-label="Rechercher un projet par nom, propriétaire, description ou sujet"
        class="w-full"
        :ui="{ base: 'py-3.5 text-base' }"
      />

      <TopicChips v-model="filters.topic" :options="topicOptions" :preferred="preferredTopics" />
    </div>
  </FrameSection>

  <FeedFilterBar
    v-model:languages="filters.languages"
    :language-options="languageOptions"
    :result-label="resultLabel"
    :can-reset="hasActiveFilters"
    @reset="resetFilters"
  >
    <SegmentedControl v-model="filters.level" label="Niveau" :items="levelItems" />

    <button
      v-if="filters.topic"
      type="button"
      class="inline-flex cursor-pointer items-center gap-1.5 border border-primary/60 bg-primary/10 px-2 py-1 font-mono text-xs text-highlighted"
      :aria-label="`Retirer le sujet ${filters.topic}`"
      @click="filters.topic = null"
    >
      #{{ filters.topic }}
      <UIcon name="lucide:x" class="size-3.5" aria-hidden="true" />
    </button>

    <template #trailing>
      <USelect
        v-model="filters.minScore"
        :items="minScoreItems"
        size="sm"
        color="neutral"
        variant="outline"
        aria-label="Filtrer par score d’accueil des débutants"
        class="w-48"
      />
      <USelect
        v-model="filters.sort"
        :items="sortItems"
        size="sm"
        color="neutral"
        variant="outline"
        aria-label="Trier les projets"
        class="w-44"
      />
    </template>
  </FeedFilterBar>

  <FrameSection>
    <FeedStatus
      :refresh-state="refreshState"
      :has-items="projectCards.length > 0"
      :copy="statusCopy"
      @retry="reload"
    >
      <FeedGrid data="projects" :items="projectCards">
        <template #item="{ item }">
          <ProjectCard :project="item" @favorite-change="setFavorite" />
        </template>
        <template #skeleton><ProjectCardSkeleton /></template>
      </FeedGrid>

      <template #empty>
        <EmptyState
          icon="lucide:search-x"
          title="Aucun projet ne correspond"
          :description="
            relaxations.length
              ? 'Élargis ta recherche, par exemple :'
              : 'Le catalogue ne contient pas encore de projet pour ces critères.'
          "
        >
          <button
            v-for="item in relaxations"
            :key="item.label"
            type="button"
            class="cursor-pointer border border-default px-3 py-2 text-sm text-toned transition-colors duration-150 hover:border-accented hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
            @click="item.apply"
          >
            {{ item.label }}
          </button>
          <UButton
            v-if="hasActiveFilters"
            label="Tout réinitialiser"
            color="neutral"
            variant="ghost"
            @click="resetFilters"
          />
        </EmptyState>
      </template>
    </FeedStatus>
  </FrameSection>
</template>
