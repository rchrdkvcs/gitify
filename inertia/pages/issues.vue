<script setup lang="ts">
import type {
  FeedIssue,
  FeedRefreshState,
  IssueFilters,
  IssueKind,
  IssueSort,
  PaginationMeta,
} from "@shared/types/index";
import { Head } from "@inertiajs/vue3";
import type { FeedStatusCopy } from "~/components/feed/FeedStatus.vue";
import { issueFilterSchema } from "~/lib/feed-filter-schemas";

const props = defineProps<{
  issues: { data: FeedIssue[]; meta: PaginationMeta };
  total: number;
  filters: IssueFilters;
  languageOptions: { value: string; label: string; icon: string }[];
  kindOptions: { value: IssueKind; label: string }[];
  refreshState: FeedRefreshState;
}>();

const kindItems = computed<{ label: string; value: IssueKind | "all"; mono?: boolean }[]>(() => [
  { label: "Toutes", value: "all" },
  ...props.kindOptions.map((option) => ({ ...option, mono: true })),
]);

const sortItems: { label: string; value: IssueSort }[] = [
  { label: "Plus récentes", value: "recent" },
  { label: "Moins commentées", value: "comments" },
  { label: "Dépôts les plus étoilés", value: "stars" },
];

const statusCopy: FeedStatusCopy = {
  degraded:
    "Certaines issues n’ont pas pu être actualisées. Celles affichées viennent du dernier relevé.",
  refreshing: "Une partie des issues sera actualisée au prochain chargement.",
  unavailable: {
    title: "Les issues sont momentanément indisponibles",
    description:
      "Impossible de récupérer les issues depuis GitHub. Réessaie dans quelques instants.",
  },
  preparing: {
    icon: "lucide:list-todo",
    title: "Les issues se préparent",
    description:
      "On récupère des issues depuis GitHub pour ces langages. Recharge la page dans quelques instants.",
  },
};

const { filters, hasActiveFilters, reload, resetFilters } = useFilteredFeed({
  schema: issueFilterSchema,
  source: props.filters,
  debounced: ["q"],
  visit: inertiaFeedVisit("/issues", {
    scroll: "issues",
    dependents: ["total", "filters", "refreshState"],
  }),
});

const resultLabel = computed(() =>
  props.total === 1 ? "1 issue" : `${props.total.toLocaleString("fr-FR")} issues`,
);
</script>

<template>
  <Head title="Issues pour moi">
    <meta
      name="description"
      content="Des issues GitHub ouvertes, libres et sans pull request en cours, dans les projets open source de tes langages."
    />
  </Head>

  <PageHeader
    eyebrow="Issues pour moi"
    title="Choisis ta prochaine contribution."
    description="Des issues ouvertes dans tous les projets, sans pull request en cours. Prends-en une, lis le contexte et lance-toi."
  >
    <template #actions>
      <FeedSearchInput
        v-model="filters.q"
        size="lg"
        placeholder="Titre ou dépôt…"
        aria-label="Rechercher une issue par titre ou par dépôt"
        class="w-full md:w-80"
      />
    </template>
  </PageHeader>

  <FeedFilterBar
    v-model:languages="filters.languages"
    :language-options="languageOptions"
    :result-label="resultLabel"
    :can-reset="hasActiveFilters"
    @reset="resetFilters"
  >
    <SegmentedControl v-model="filters.kind" label="Type d’issue" :items="kindItems" />
    <USwitch
      v-model="filters.unassigned"
      label="Non assignées"
      size="sm"
      :ui="{ label: 'text-xs' }"
    />

    <template #trailing>
      <USelect
        v-model="filters.sort"
        :items="sortItems"
        size="sm"
        color="neutral"
        variant="outline"
        aria-label="Trier les issues"
        class="w-52"
      />
    </template>
  </FeedFilterBar>

  <FrameSection>
    <FeedStatus
      :refresh-state="refreshState"
      :has-items="issues.data.length > 0"
      :copy="statusCopy"
      @retry="reload"
    >
      <FeedGrid data="issues" :items="issues.data">
        <template #item="{ item }"><IssueCard :issue="item" /></template>
        <template #skeleton><IssueCardSkeleton /></template>
      </FeedGrid>

      <template #empty>
        <EmptyState
          v-if="!hasActiveFilters"
          icon="lucide:languages"
          title="Choisis un langage pour commencer"
          description="Sélectionne un ou plusieurs langages : on va chercher les issues ouvertes de leurs projets."
        />
        <EmptyState
          v-else
          icon="lucide:search-x"
          title="Aucune issue ne correspond"
          description="Élargis ta recherche, change de langage ou réinitialise les filtres."
        >
          <UButton
            label="Réinitialiser les filtres"
            color="neutral"
            variant="outline"
            @click="resetFilters"
          />
        </EmptyState>
      </template>
    </FeedStatus>
  </FrameSection>
</template>
