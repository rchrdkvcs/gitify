<script setup lang="ts">
import { useProjects } from "~/composables/useProjects";

definePageMeta({
  middleware: "auth",
});

const {
  projects,
  isLoading,
  hasMore,
  languageFilter,
  searchQuery,
  starSort,
  getFourProjects,
  loadMore,
} = useProjects();

const authStore = useAuthStore();
const itemsLangage = ref<string[]>([]);
const languagesReady = ref(false);
const isFiltersOpen = ref(false);

const { sentinel, reobserve } = useInfiniteSentinel({
  canLoad: () => hasMore.value && !isLoading.value,
  onLoad: () => loadMore(4),
});

watch([languageFilter, searchQuery, starSort], () => {
  nextTick(reobserve);
});

onMounted(() => {
  const languages = authStore.user?.preferences?.languages;
  if (languages) {
    itemsLangage.value = [...languages];
    languageFilter.value = [...languages];
  }
  languagesReady.value = true;
  getFourProjects().then(() => nextTick(reobserve));
});
</script>

<template>
  <section class="flex">
    <ExploreFiltersSidebar
      v-model:open="isFiltersOpen"
      v-model:languages="languageFilter"
      v-model:search="searchQuery"
      v-model:sort="starSort"
      :language-items="itemsLangage"
      :languages-ready="languagesReady"
    />

    <div class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <UPageHero
        :ui="{
          container: '!py-0 !pb-8 lg:!pb-14',
        }"
      >
        <template #title>
          <h1 class="title text-left text-3xl sm:text-4xl">Explorer les Répositories</h1>
        </template>
        <template #description>
          <p class="text-left text-base">
            Trouvez des projets open source qui ont besoin de votre aide et commencez à y contribuer
            dès aujourd’hui.
          </p>
        </template>
      </UPageHero>

      <UButton
        icon="line-md:filter"
        label="Filtres"
        color="secondary"
        class="mb-6 lg:hidden"
        @click="isFiltersOpen = true"
      />

      <ExploreProjectsGrid :projects="projects" :loading="isLoading" />

      <div ref="sentinel" class="h-px w-full" />
    </div>
  </section>
</template>
