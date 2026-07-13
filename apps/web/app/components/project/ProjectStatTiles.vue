<script setup lang="ts">
import type { ProjectDetail } from "@gitify/types";

const props = withDefaults(
  defineProps<{
    project: ProjectDetail;
    tileClass?: string;
  }>(),
  {
    tileClass:
      "flex flex-col items-center gap-1 rounded-lg py-4 bg-white/5 ring-0 border border-white/5",
  },
);

const tiles = computed(() => {
  return [
    {
      label: "Stars",
      value: formatCompact(props.project.stars),
      accent: "text-yellow-500",
      icon: "material-symbols:star-outline",
    },
    {
      label: "Forks",
      value: formatCompact(props.project.forksCount),
      accent: "text-white",
      icon: "ic:twotone-fork-right",
    },
  ];
});
</script>

<template>
  <div class="grid gap-3" :class="tiles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'">
    <div v-for="tile in tiles" :key="tile.label" :class="tileClass">
      <UIcon :name="tile.icon" class="size-6" :class="tile.accent" />
      <span class="font-jetbrains text-xl font-bold" :class="tile.accent">{{ tile.value }}</span>
      <span class="text-xs tracking-widest text-lightgreen uppercase">{{ tile.label }}</span>
    </div>
  </div>
</template>
