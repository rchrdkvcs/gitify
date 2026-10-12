<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";

const props = defineProps<{
  project: ProjectDetail;
}>();

const difficultyLabel = computed(() =>
  props.project.difficulty === "beginner" ? "good first issue" : "help wanted",
);

const { isFavorite, pending, toggleFavorite } = useFavorite(() => props.project);
</script>

<template>
  <FrameSection inner-class="px-4 py-10 sm:px-8 sm:py-14">
    <nav aria-label="Fil d’Ariane" class="mb-8 font-mono text-xs text-muted">
      <ol class="flex flex-wrap items-center gap-1.5">
        <li>
          <ULink to="/explore" class="transition-colors hover:text-highlighted">Explorer</ULink>
        </li>
        <li aria-hidden="true" class="text-dimmed">/</li>
        <li>{{ project.ownerName }}</li>
        <li aria-hidden="true" class="text-dimmed">/</li>
        <li aria-current="page" class="text-highlighted">{{ project.name }}</li>
      </ol>
    </nav>

    <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div class="flex min-w-0 flex-col gap-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center border border-default bg-elevated font-mono text-xl text-highlighted"
            aria-hidden="true"
          >
            {{ project.name.charAt(0).toUpperCase() }}
          </div>
          <h1
            class="min-w-0 font-mono text-2xl tracking-tight break-words text-highlighted sm:text-3xl"
          >
            <span class="text-muted">{{ project.ownerName }}/</span>{{ project.name }}
          </h1>
        </div>

        <p class="max-w-2xl text-base leading-relaxed text-muted">
          {{ project.description || "Pas de description pour ce projet." }}
        </p>

        <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span class="border border-accented px-2 py-1 text-toned">{{ difficultyLabel }}</span>
          <span
            v-if="project.language"
            class="inline-flex items-center gap-1.5 border border-default px-2 py-1 text-muted"
          >
            <span class="size-1.5 bg-current" aria-hidden="true" />
            {{ formatLanguage(project.language) }}
          </span>
          <span
            v-for="topic in (project.topics ?? []).slice(0, 4)"
            :key="topic"
            class="border border-default px-2 py-1 text-muted"
          >
            {{ topic }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap gap-3">
        <UButton
          :to="`${project.repositoryUrl}/issues`"
          target="_blank"
          label="Voir les issues"
          trailing-icon="lucide:arrow-up-right"
          size="lg"
        />
        <UButton
          :icon="isFavorite ? 'tabler:heart-filled' : 'tabler:heart'"
          :label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          :loading="pending"
          color="neutral"
          variant="outline"
          size="lg"
          :ui="{ leadingIcon: isFavorite ? 'text-primary' : '' }"
          @click="toggleFavorite"
        />
        <UButton
          :to="project.repositoryUrl"
          target="_blank"
          icon="lucide:github"
          aria-label="Ouvrir sur GitHub"
          color="neutral"
          variant="outline"
          size="lg"
        />
      </div>
    </div>
  </FrameSection>
</template>
