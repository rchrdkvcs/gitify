<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

defineProps<{
  project: ProjectDetail;
}>();
</script>

<template>
  <div class="rounded-lg border border-secondary bg-linear-to-br from-dark to-card p-5">
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-white">Infos</h2>
    <dl class="flex flex-col gap-2 text-sm">
      <div v-if="project.latestRelease" class="flex items-center justify-between">
        <dt class="text-lightgray">Version</dt>
        <dd class="font-jetbrains text-lightgreen">{{ project.latestRelease }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-lightgray">Créé le</dt>
        <dd class="font-jetbrains text-white">{{ formatDate(project.createdAt) }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-lightgray">Mis à jour le</dt>
        <dd class="font-jetbrains text-white">{{ formatDate(project.updatedAt) }}</dd>
      </div>
    </dl>
  </div>
</template>
