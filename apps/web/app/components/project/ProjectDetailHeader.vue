<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

const props = defineProps<{
  project: ProjectDetail;
}>();

const difficultyLabel = computed(() =>
  props.project.difficulty === "beginner" ? "Beginner Friendly" : "Expert",
);
</script>

<template>
  <div>
    <!-- Breadcrumb (desktop) / retour (mobile) -->
    <UBreadcrumb
      :items="[
        { label: 'Projets', to: '/explore' },
        { label: project.name, class: 'text-brand-green' },
      ]"
      separator-icon="lucide:chevron-right"
      class="hidden pb-6 lg:block"
      :ui="{
        link: 'text-sm font-normal text-muted hover:text-ink transition-colors',
        separatorIcon: 'size-4 text-muted',
      }"
    />
    <button
      class="flex cursor-pointer items-center gap-2 pb-6 font-jetbrains font-bold text-ink transition-colors hover:text-brand-green lg:hidden"
      @click="$router.back()"
    >
      <UIcon name="lucide:arrow-left" class="size-5 text-primary" />
      Repository
    </button>

    <header class="flex flex-col gap-4 pb-8">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="font-jetbrains text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {{ project.name }}
        </h1>
        <span
          class="rounded-full border border-green-500/40 px-3 py-0.5 font-jetbrains text-xs font-bold tracking-widest text-green-500 uppercase"
        >
          Public
        </span>
      </div>

      <p class="max-w-2xl text-base text-muted">
        {{ project.description || "Aucune description disponible pour ce repository." }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          v-if="project.language"
          color="secondary"
          size="sm"
          class="items-center gap-1.5 capitalize"
        >
          <span class="size-2 rounded-full bg-green-500" />
          {{ project.language }}
        </UBadge>
        <UBadge color="secondary" size="sm" class="items-center gap-1.5">
          <UIcon name="tabler:star-filled" class="size-3 text-yellow-500" />
          {{ difficultyLabel }}
        </UBadge>
        <UBadge
          v-for="topic in (project.topics ?? []).slice(0, 4)"
          :key="topic"
          color="secondary"
          size="sm"
        >
          {{ topic }}
        </UBadge>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <UButton
          icon="tabler:star-filled"
          label="Star"
          color="brand"
          size="lg"
          :to="project.repositoryUrl"
          target="_blank"
          class="justify-center font-bold sm:min-w-40"
        />
        <UButton
          icon="lucide:git-fork"
          label="Fork"
          color="secondary"
          size="lg"
          :to="`${project.repositoryUrl}/fork`"
          target="_blank"
          class="justify-center font-bold sm:min-w-40"
        />
      </div>

      <!-- Tuiles de stats (mobile/tablette, cf. maquette mobile) -->
      <ProjectStatTiles :project="project" class="lg:hidden" />
    </header>
  </div>
</template>
