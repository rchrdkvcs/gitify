<script setup lang="ts">
import type {
  Difficulty,
  ExploreFilters,
  ExploreSort,
  FeedRefreshState,
  PaginationMeta,
  Project,
} from "@shared/types/index";
import { Head, InfiniteScroll, router } from "@inertiajs/vue3";

const props = defineProps<{
  projects: { data: Project[]; meta: PaginationMeta };
  total: number;
  filters: ExploreFilters;
  topicOptions: string[];
  languageOptions: { value: string; label: string; icon: string }[];
  refreshState: FeedRefreshState;
}>();

const searchQuery = ref(props.filters.q);
const topic = ref<string | null>(props.filters.topic);
const languages = ref<string[]>([...props.filters.languages]);
const level = ref<Difficulty | "all">(props.filters.level);
const sort = ref<ExploreSort>(props.filters.sort);

const levelItems: { label: string; value: Difficulty | "all" }[] = [
  { label: "Tous niveaux", value: "all" },
  { label: "Débutant", value: "beginner" },
  { label: "Confirmé", value: "expert" },
];

const sortItems: { label: string; value: ExploreSort }[] = [
  { label: "Plus d’étoiles", value: "stars" },
  { label: "Activité récente", value: "recent" },
  { label: "Plus d’issues", value: "issues" },
];

function applyFilters() {
  router.get(
    "/explore",
    {
      q: searchQuery.value.trim() || undefined,
      topic: topic.value ?? undefined,
      language: languages.value.length ? languages.value.join(",") : undefined,
      // Always explicit, so "all levels" is not replaced by the reader's preferences.
      level: level.value,
      sort: sort.value === "stars" ? undefined : sort.value,
    },
    {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      // Resetting a scroll prop implies a partial reload; ask for every filter-dependent prop.
      only: ["projects", "total", "filters", "topicOptions", "refreshState"],
      reset: ["projects"],
    },
  );
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});
watch([languages, level, sort, topic], applyFilters, { deep: true });

function toggleTopic(value: string) {
  topic.value = topic.value === value ? null : value;
}

const search = useTemplateRef<{ inputRef: HTMLInputElement | null }>("search");
defineShortcuts({ "/": () => search.value?.inputRef?.focus() });

const resultLabel = computed(() =>
  props.total === 1 ? "1 projet" : `${props.total.toLocaleString("fr-FR")} projets`,
);

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== "" ||
    topic.value !== null ||
    languages.value.length > 0 ||
    level.value !== "all" ||
    sort.value !== "stars",
);

function resetFilters() {
  searchQuery.value = "";
  topic.value = null;
  languages.value = [];
  level.value = "all";
  sort.value = "stars";
}

const chipClass = (active: boolean) =>
  active
    ? "border-primary/60 bg-primary/10 text-highlighted"
    : "border-default text-muted hover:border-accented hover:text-highlighted";
</script>

<template>
  <Head title="Explorer">
    <meta
      name="description"
      content="Parcours des projets open source GitHub par langage et par niveau, avec leurs issues prêtes à être prises."
    />
  </Head>

  <FrameSection inner-class="px-4 py-12 sm:px-8 sm:py-16">
    <div class="flex max-w-3xl flex-col gap-6">
      <p class="eyebrow">
        <span class="size-1.5 bg-primary" aria-hidden="true" />
        Catalogue
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-5xl">
        Trouve ton prochain projet open source.
      </h1>

      <UInput
        ref="search"
        v-model="searchQuery"
        icon="lucide:search"
        size="xl"
        type="search"
        placeholder="Nom, propriétaire, description ou sujet…"
        aria-label="Rechercher un projet par nom, propriétaire, description ou sujet"
        class="w-full"
        :ui="{ base: 'py-3.5 text-base' }"
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

      <div v-if="topicOptions.length" class="flex flex-wrap items-center gap-1.5">
        <span class="me-1 font-mono text-xs text-dimmed">Sujets populaires</span>
        <button
          v-for="item in topicOptions"
          :key="item"
          type="button"
          :aria-pressed="topic === item"
          class="cursor-pointer border px-2 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          :class="chipClass(topic === item)"
          @click="toggleTopic(item)"
        >
          {{ item }}
        </button>
      </div>
    </div>
  </FrameSection>

  <FrameSection class="sticky top-(--ui-header-height) z-20 bg-default/90 backdrop-blur">
    <LanguageFilterTabs v-model="languages" :options="languageOptions" />

    <div class="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
      <div class="flex border border-default" role="group" aria-label="Niveau">
        <button
          v-for="item in levelItems"
          :key="item.value"
          type="button"
          :aria-pressed="level === item.value"
          class="cursor-pointer border-e border-default px-3 py-1.5 text-xs transition-colors last:border-e-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :class="
            level === item.value
              ? 'bg-elevated text-highlighted'
              : 'text-muted hover:text-highlighted'
          "
          @click="level = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <button
        v-if="topic"
        type="button"
        class="inline-flex cursor-pointer items-center gap-1.5 border border-primary/60 bg-primary/10 px-2 py-1 font-mono text-xs text-highlighted"
        :aria-label="`Retirer le sujet ${topic}`"
        @click="topic = null"
      >
        #{{ topic }}
        <UIcon name="lucide:x" class="size-3.5" aria-hidden="true" />
      </button>

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
        aria-label="Trier les projets"
        class="w-44"
      />
    </div>
  </FrameSection>

  <FrameSection>
    <p
      v-if="projects.data.length && refreshState === 'degraded'"
      role="status"
      class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
    >
      Certains projets n’ont pas pu être actualisés. Tu peux explorer ceux déjà disponibles.
    </p>

    <p
      v-if="projects.data.length && refreshState === 'refreshing'"
      role="status"
      class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
    >
      Une partie du catalogue sera actualisée au prochain chargement.
    </p>

    <InfiniteScroll v-if="projects.data.length" data="projects" :buffer="600">
      <ProjectGrid>
        <ProjectGridItem v-for="project in projects.data" :key="project.id">
          <ProjectCard
            :project="project"
            @favorite-change="(_, value) => (project.isFavorite = value)"
          />
        </ProjectGridItem>
      </ProjectGrid>
      <template #loading>
        <ProjectGrid>
          <ProjectGridItem v-for="n in 3" :key="n">
            <ProjectCardSkeleton />
          </ProjectGridItem>
        </ProjectGrid>
      </template>
    </InfiniteScroll>

    <EmptyState
      v-else-if="refreshState === 'unavailable'"
      icon="lucide:wifi-off"
      title="Les projets sont momentanément indisponibles"
      description="Impossible de récupérer les projets. Réessaie dans quelques instants."
    >
      <UButton label="Réessayer" color="neutral" variant="outline" @click="applyFilters" />
    </EmptyState>

    <EmptyState
      v-else-if="refreshState === 'refreshing'"
      icon="lucide:folder-search"
      title="Le catalogue se prépare"
      description="On récupère des projets depuis GitHub pour ces langages. Recharge la page dans quelques instants."
    />

    <EmptyState
      v-else
      icon="lucide:search-x"
      title="Aucun projet ne correspond"
      description="Élargis ta recherche ou réinitialise les filtres."
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
