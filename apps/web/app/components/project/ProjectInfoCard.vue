<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

defineProps<{
  project: ProjectDetail;
}>();
</script>

<template>
  <div class="rounded-lg border border-border bg-linear-to-br from-canvas to-surface p-5">
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-ink">Infos</h2>
    <dl class="flex flex-col gap-2 text-sm">
      <div v-if="project.latestRelease" class="flex items-center justify-between">
        <dt class="text-muted">Version</dt>
        <dd class="font-jetbrains text-brand-green">{{ project.latestRelease }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-muted">Créé le</dt>
        <dd class="font-jetbrains text-ink">{{ formatDate(project.createdAt) }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-muted">Mis à jour le</dt>
        <dd class="font-jetbrains text-ink">{{ formatDate(project.updatedAt) }}</dd>
      </div>
    </dl>
  </div>
</template>
