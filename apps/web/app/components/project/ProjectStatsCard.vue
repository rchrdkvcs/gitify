<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

const props = defineProps<{
  project: ProjectDetail;
}>();

const extraContributorsCount = computed(() => (props.project.totalContributorsCount ?? 4) - 4);
</script>

<template>
  <div class="rounded-lg border border-border bg-linear-to-tr from-canvas to-surface p-5">
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-ink">Statistiques</h2>
    <ProjectStatTiles :project="project" />
    <div
      v-if="project.contributors?.length"
      class="mt-3 flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-4"
    >
      <div class="flex -space-x-2">
        <UAvatar
          v-for="contributor in project.contributors.slice(0, 4)"
          :key="contributor.id"
          :src="contributor.avatarUrl"
          :alt="contributor.login"
          size="md"
          class="ring-2 ring-border"
        />
        <span
          v-if="extraContributorsCount > 0"
          class="flex size-8 items-center justify-center rounded-full bg-surface-strong font-jetbrains text-[10px] font-bold text-brand-green ring-1 ring-brand-green"
        >
          +{{ formatCompact(extraContributorsCount) }}
        </span>
      </div>
      <span class="text-xs tracking-widest text-brand-green uppercase">Contributeurs Actifs</span>
    </div>
  </div>
</template>
