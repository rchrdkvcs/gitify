<script setup lang="ts">
import type { ShowcaseProject } from "@shared/types/index";
import type { ShowcaseLanguageResult } from "@shared/types/index";

const props = defineProps<{ languages: ShowcaseLanguageResult[] }>();

const ALL = "all";
const selectedLanguage = ref<string>(ALL);

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

// Picked once per page view so the "Tous" tab doesn't reshuffle on every click.
const mixedSelection = computed<ShowcaseProject[]>(() =>
  shuffle((props.languages ?? []).flatMap((group) => group.projects)).slice(0, 6),
);

const visibleProjects = computed<ShowcaseProject[]>(() => {
  if (selectedLanguage.value === ALL) return mixedSelection.value;
  return props.languages.find((group) => group.language === selectedLanguage.value)?.projects ?? [];
});

const tabs = computed(() => [
  { value: ALL, label: "Tous" },
  ...(props.languages ?? []).map((group) => ({
    value: group.language,
    label: formatLanguage(group.language),
  })),
]);
</script>

<template>
  <FrameSection>
    <div
      class="flex flex-col gap-8 border-b border-default px-4 py-14 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between"
    >
      <SectionHeading
        eyebrow="Vitrine"
        title="Projets à la une"
        description="Une sélection tirée de notre catalogue, renouvelée à chaque visite."
      />
      <UButton
        to="/explore"
        color="neutral"
        variant="outline"
        trailing-icon="lucide:arrow-right"
        label="Voir tous les projets"
        class="w-fit shrink-0"
      />
    </div>

    <div
      v-if="tabs.length > 1"
      class="no-scrollbar flex overflow-x-auto border-b border-default"
      role="group"
      aria-label="Filtrer par langage"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :aria-pressed="selectedLanguage === tab.value"
        class="relative shrink-0 cursor-pointer border-r border-default px-4 py-3 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        :class="
          selectedLanguage === tab.value
            ? 'bg-muted text-highlighted'
            : 'text-muted hover:bg-muted/50 hover:text-highlighted'
        "
        @click="selectedLanguage = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="selectedLanguage === tab.value"
          class="absolute inset-x-0 bottom-0 h-px bg-primary"
          aria-hidden="true"
        />
      </button>
    </div>

    <ProjectGrid v-if="visibleProjects.length">
      <ProjectGridItem v-for="project in visibleProjects" :key="project.id">
        <ProjectCard :project="project" />
      </ProjectGridItem>
    </ProjectGrid>

    <EmptyState
      v-else
      icon="lucide:folder-search"
      title="La vitrine se remplit"
      description="Les premiers projets arrivent depuis GitHub. Reviens dans quelques minutes."
    />
  </FrameSection>
</template>
