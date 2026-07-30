<script setup lang="ts">
import type { Project } from "@gitify/types";

const { projects } = defineProps<{
  projects: Project[];
  loading: boolean;
}>();

function handleFavoriteChange(projectId: string, isFavorite: boolean) {
  const project = projects.find((item) => item.id === projectId);
  if (project) {
    project.isFavorite = isFavorite;
  }
}
</script>

<template>
  <div>
    <div class="4xl:grid-cols-4 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 2xl:grid-cols-3">
      <template v-if="loading">
        <ProjectCardSkeleton v-for="n in 4" :key="n" />
      </template>
      <template v-else>
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          class="h-full"
          @favorite-change="handleFavoriteChange"
        />
      </template>
    </div>

    <p v-if="!loading && !projects.length" class="py-16 text-center font-jetbrains text-muted">
      Aucun projet ne correspond à tes filtres.
    </p>
  </div>
</template>
