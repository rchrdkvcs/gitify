<script setup lang="ts">
import type { FeedRefreshState, Project } from "@shared/types/index";
import { Head, router } from "@inertiajs/vue3";
import { normalizePreferenceLanguages } from "@shared/preferences";

const props = defineProps<{ projects: Project[]; refreshState: FeedRefreshState }>();
const { projects, total, hasMore, languageFilter, searchQuery, starSort, loadMore, resetFilters } =
  useProjects(() => props.projects);

const authStore = useAuth();
const preferredLanguages = ref<string[]>([]);
const languagesReady = ref(false);
const isFiltersOpen = ref(false);

const { reobserve } = useInfiniteSentinel({
  canLoad: () => hasMore.value,
  onLoad: () => loadMore(),
});

watch([languageFilter, searchQuery, starSort], () => {
  nextTick(reobserve);
});

onMounted(() => {
  const languages = authStore.user?.preferences?.languages;
  if (languages) {
    preferredLanguages.value = normalizePreferenceLanguages(languages);
    languageFilter.value = [...preferredLanguages.value];
  }
  languagesReady.value = true;
  nextTick(reobserve);
});

const levelLabel = computed(() =>
  authStore.user?.preferences?.difficulty === "expert" ? "confirmé" : "débutant",
);

const resultLabel = computed(() =>
  total.value === 1 ? "1 projet" : `${total.value.toLocaleString("fr-FR")} projets`,
);

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== "" ||
    starSort.value !== "default" ||
    languageFilter.value.length !== preferredLanguages.value.length,
);
</script>

<template>
  <Head title="Explorer" />

  <PageHeader
    eyebrow="Ton fil"
    title="Explorer les projets"
    :description="`Des projets sélectionnés pour ton niveau ${levelLabel} et tes langages. Choisis-en un et lance-toi.`"
  />

  <FrameSection>
    <div class="lg:grid lg:grid-cols-[16rem_1fr]">
      <aside class="hidden border-e border-default lg:block" aria-label="Filtres">
        <div class="sticky top-(--ui-header-height)">
          <ExploreFilters
            v-model:languages="languageFilter"
            v-model:sort="starSort"
            :language-items="preferredLanguages"
            :languages-ready="languagesReady"
          />
        </div>
      </aside>

      <div class="min-w-0">
        <div
          class="sticky top-(--ui-header-height) z-10 flex items-center gap-3 border-b border-default bg-default/90 px-4 py-3 backdrop-blur sm:px-5"
        >
          <UInput
            v-model="searchQuery"
            icon="lucide:search"
            placeholder="Rechercher un projet"
            aria-label="Rechercher un projet par nom"
            type="search"
            class="max-w-sm flex-1"
          />
          <UButton
            icon="lucide:sliders-horizontal"
            label="Filtres"
            color="neutral"
            variant="outline"
            class="lg:hidden"
            @click="isFiltersOpen = true"
          />
          <p
            class="ms-auto font-mono text-xs whitespace-nowrap text-muted max-sm:sr-only"
            role="status"
          >
            {{ resultLabel }}
          </p>
        </div>

        <p
          v-if="props.projects.length && props.refreshState === 'degraded'"
          role="status"
          class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
        >
          Certains projets n’ont pas pu être actualisés. Tu peux explorer ceux déjà disponibles.
        </p>

        <p
          v-if="props.projects.length && props.refreshState === 'refreshing'"
          role="status"
          class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
        >
          Une partie du fil sera actualisée au prochain chargement.
        </p>

        <ProjectGrid v-if="projects.length">
          <ProjectGridItem v-for="project in projects" :key="project.id">
            <ProjectCard
              :project="project"
              @favorite-change="(_, value) => (project.isFavorite = value)"
            />
          </ProjectGridItem>
        </ProjectGrid>

        <EmptyState
          v-else-if="props.projects.length"
          icon="lucide:search-x"
          title="Aucun projet ne correspond"
          description="Élargis ta recherche ou réinitialise les filtres pour revoir tout ton fil."
        >
          <UButton
            v-if="hasActiveFilters"
            label="Réinitialiser les filtres"
            color="neutral"
            variant="outline"
            @click="resetFilters(preferredLanguages)"
          />
        </EmptyState>

        <EmptyState
          v-else-if="props.refreshState === 'unavailable'"
          icon="lucide:wifi-off"
          title="Les projets sont momentanément indisponibles"
          description="Impossible de récupérer les projets. Réessaie dans quelques instants."
        >
          <UButton
            label="Réessayer"
            color="neutral"
            variant="outline"
            @click="router.reload({ only: ['projects', 'refreshState'] })"
          />
        </EmptyState>

        <EmptyState
          v-else-if="props.refreshState === 'refreshing'"
          icon="lucide:folder-search"
          title="Ton fil se prépare"
          description="On récupère des projets depuis GitHub pour tes langages. Recharge la page dans quelques instants."
        >
          <UButton
            to="/preferences"
            label="Modifier mes préférences"
            color="neutral"
            variant="outline"
          />
        </EmptyState>

        <EmptyState
          v-else
          icon="lucide:folder-search"
          title="Aucun projet pour ces préférences"
          description="Essaie d’autres langages ou un autre niveau pour découvrir des projets."
        >
          <UButton
            to="/preferences"
            label="Modifier mes préférences"
            color="neutral"
            variant="outline"
          />
        </EmptyState>

        <div ref="sentinel" class="h-px w-full" aria-hidden="true" />
      </div>
    </div>
  </FrameSection>

  <USlideover v-model:open="isFiltersOpen" title="Filtres" side="left" class="lg:hidden">
    <template #body>
      <div class="-m-4 sm:-m-6">
        <ExploreFilters
          v-model:languages="languageFilter"
          v-model:sort="starSort"
          :language-items="preferredLanguages"
          :languages-ready="languagesReady"
        />
      </div>
    </template>
  </USlideover>
</template>
