<script setup lang="ts">
import type { Project } from "@gitify/types";

defineProps<{
  projects: Project[];
  loading: boolean;
}>();
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
        />
      </template>
    </div>

    <p v-if="!loading && !projects.length" class="py-16 text-center font-jetbrains text-lightgray">
      Aucun projet ne correspond à tes filtres.
    </p>
  </div>
</template>
