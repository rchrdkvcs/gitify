<script setup lang="ts">
import type {
  FeedIssue,
  FeedRefreshState,
  IssueFilters,
  IssueKind,
  IssueSort,
  PaginationMeta,
} from "@shared/types/index";
import { Head, InfiniteScroll, router } from "@inertiajs/vue3";

const props = defineProps<{
  issues: { data: FeedIssue[]; meta: PaginationMeta };
  total: number;
  filters: IssueFilters;
  languageOptions: { value: string; label: string; icon: string }[];
  kindOptions: { value: IssueKind; label: string }[];
  refreshState: FeedRefreshState;
}>();

const searchQuery = ref(props.filters.q);
const languages = ref<string[]>([...props.filters.languages]);
const kind = ref<IssueKind | "all">(props.filters.kind);
const unassigned = ref(props.filters.unassigned);
const sort = ref<IssueSort>(props.filters.sort);

const kindItems = computed<{ label: string; value: IssueKind | "all" }[]>(() => [
  { label: "Toutes", value: "all" },
  ...props.kindOptions,
]);

const sortItems: { label: string; value: IssueSort }[] = [
  { label: "Plus récentes", value: "recent" },
  { label: "Moins commentées", value: "comments" },
  { label: "Dépôts les plus étoilés", value: "stars" },
];

function applyFilters() {
  router.get(
    "/issues",
    {
      q: searchQuery.value.trim() || undefined,
      language: languages.value.length ? languages.value.join(",") : undefined,
      // Always explicit, so "all kinds" is not replaced by the reader's preferences.
      label: kind.value,
      unassigned: unassigned.value ? undefined : "0",
      sort: sort.value === "recent" ? undefined : sort.value,
    },
    {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      // Resetting a scroll prop implies a partial reload; ask for every filter-dependent prop.
      only: ["issues", "total", "filters", "refreshState"],
      reset: ["issues"],
    },
  );
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});
watch([languages, kind, unassigned, sort], applyFilters, { deep: true });

const search = useTemplateRef<{ inputRef: HTMLInputElement | null }>("search");
defineShortcuts({ "/": () => search.value?.inputRef?.focus() });

const resultLabel = computed(() =>
  props.total === 1 ? "1 issue" : `${props.total.toLocaleString("fr-FR")} issues`,
);

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== "" ||
    languages.value.length > 0 ||
    kind.value !== "all" ||
    !unassigned.value ||
    sort.value !== "recent",
);

function resetFilters() {
  searchQuery.value = "";
  languages.value = [];
  kind.value = "all";
  unassigned.value = true;
  sort.value = "recent";
}
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
      <UInput
        ref="search"
        v-model="searchQuery"
        icon="lucide:search"
        size="lg"
        type="search"
        placeholder="Titre ou dépôt…"
        aria-label="Rechercher une issue par titre ou par dépôt"
        class="w-full md:w-80"
      >
        <template #trailing>
          <UButton
            v-if="searchQuery"
            icon="lucide:x"
            aria-label="Effacer la recherche"
            color="neutral"
            variant="link"
            size="sm"
            @click="searchQuery = ''"
          />
          <UKbd v-else value="/" />
        </template>
      </UInput>
    </template>
  </PageHeader>

  <FrameSection class="sticky top-(--ui-header-height) z-20 bg-default/90 backdrop-blur">
    <LanguageFilterTabs v-model="languages" :options="languageOptions" />

    <div class="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
      <div class="flex border border-default" role="group" aria-label="Type d’issue">
        <button
          v-for="item in kindItems"
          :key="item.value"
          type="button"
          :aria-pressed="kind === item.value"
          class="cursor-pointer border-e border-default px-3 py-1.5 text-xs transition-colors last:border-e-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :class="[
            kind === item.value
              ? 'bg-elevated text-highlighted'
              : 'text-muted hover:text-highlighted',
            item.value === 'all' ? '' : 'font-mono',
          ]"
          @click="kind = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <USwitch v-model="unassigned" label="Non assignées" size="sm" :ui="{ label: 'text-xs' }" />

      <UButton
        v-if="hasActiveFilters"
        label="Réinitialiser"
        color="neutral"
        variant="link"
        size="sm"
        class="text-muted"
        @click="resetFilters"
      />

      <p class="ms-auto font-mono text-xs whitespace-nowrap text-muted" role="status">
        {{ resultLabel }}
      </p>
      <USelect
        v-model="sort"
        :items="sortItems"
        size="sm"
        color="neutral"
        variant="outline"
        aria-label="Trier les issues"
        class="w-52"
      />
    </div>
  </FrameSection>

  <FrameSection>
    <p
      v-if="issues.data.length && refreshState === 'degraded'"
      role="status"
      class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
    >
      Certaines issues n’ont pas pu être actualisées. Celles affichées viennent du dernier relevé.
    </p>

    <p
      v-if="issues.data.length && refreshState === 'refreshing'"
      role="status"
      class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
    >
      Une partie des issues sera actualisée au prochain chargement.
    </p>

    <InfiniteScroll v-if="issues.data.length" data="issues" :buffer="600">
      <ProjectGrid>
        <ProjectGridItem v-for="issue in issues.data" :key="issue.id">
          <IssueCard :issue="issue" />
        </ProjectGridItem>
      </ProjectGrid>
      <template #loading>
        <ProjectGrid>
          <ProjectGridItem v-for="n in 3" :key="n">
            <IssueCardSkeleton />
          </ProjectGridItem>
        </ProjectGrid>
      </template>
    </InfiniteScroll>

    <EmptyState
      v-else-if="refreshState === 'unavailable'"
      icon="lucide:wifi-off"
      title="Les issues sont momentanément indisponibles"
      description="Impossible de récupérer les issues depuis GitHub. Réessaie dans quelques instants."
    >
      <UButton label="Réessayer" color="neutral" variant="outline" @click="applyFilters" />
    </EmptyState>

    <EmptyState
      v-else-if="refreshState === 'refreshing'"
      icon="lucide:list-todo"
      title="Les issues se préparent"
      description="On récupère des issues depuis GitHub pour ces langages. Recharge la page dans quelques instants."
    />

    <EmptyState
      v-else-if="!hasActiveFilters"
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
        v-if="hasActiveFilters"
        label="Réinitialiser les filtres"
        color="neutral"
        variant="outline"
        @click="resetFilters"
      />
    </EmptyState>
  </FrameSection>
</template>
