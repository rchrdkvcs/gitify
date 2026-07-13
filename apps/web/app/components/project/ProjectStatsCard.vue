<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

const props = defineProps<{
  project: ProjectDetail;
}>();

const extraContributorsCount = computed(() => (props.project.totalContributorsCount ?? 4) - 4);
</script>

<template>
  <div class="rounded-lg border border-secondary bg-linear-to-tr from-dark to-card p-5">
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-white">Statistiques</h2>
    <ProjectStatTiles :project="project" />
    <div
      v-if="project.contributors?.length"
      class="mt-3 flex flex-col items-center gap-2 rounded-lg border border-white/5 bg-white/5 py-4"
    >
      <div class="flex -space-x-2">
        <UAvatar
          v-for="contributor in project.contributors.slice(0, 4)"
          :key="contributor.id"
          :src="contributor.avatarUrl"
          :alt="contributor.login"
          size="md"
          class="ring-2 ring-secondary"
        />
        <span
          v-if="extraContributorsCount > 0"
          class="flex size-8 items-center justify-center rounded-full bg-secondary font-jetbrains text-[10px] font-bold text-lightgreen ring-1 ring-lightgreen"
        >
          +{{ formatCompact(extraContributorsCount) }}
        </span>
      </div>
      <span class="text-xs tracking-widest text-lightgreen uppercase">Contributeurs Actifs</span>
    </div>
  </div>
</template>
