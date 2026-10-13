<script setup lang="ts">
import { languageCatalog } from "@shared/preferences";

const props = defineProps<{ selected: string[] }>();

const chips = computed(() => {
  const chosen = languageCatalog.filter((item) => props.selected.includes(item.id));
  const others = languageCatalog.filter((item) => !props.selected.includes(item.id));
  return [...chosen, ...others].slice(0, 9).map((item, index) => ({
    id: item.id,
    label: item.label,
    active: props.selected.includes(item.id),
    x: 22 + (index % 3) * 96,
    y: 22 + Math.floor(index / 3) * 52,
  }));
});
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <g v-for="chip in chips" :key="chip.id">
      <rect
        :x="chip.x + 0.5"
        :y="chip.y + 0.5"
        width="84"
        height="36"
        class="ill-shift"
        :class="chip.active ? 'ill-accent ill-accent-soft' : 'ill-line ill-fill'"
      />
      <text
        :x="chip.x + 42"
        :y="chip.y + 23"
        text-anchor="middle"
        font-size="12"
        :class="chip.active ? 'ill-text-strong' : 'ill-text'"
      >
        {{ chip.label }}
      </text>
      <rect
        v-if="chip.active"
        :x="chip.x + 72"
        :y="chip.y + 4"
        width="8"
        height="8"
        class="ill-accent-fill ill-pop"
      />
    </g>
  </svg>
</template>
