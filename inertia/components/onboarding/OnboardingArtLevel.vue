<script setup lang="ts">
import type { ExperienceLevel } from "@shared/types/index";

const props = defineProps<{ level: ExperienceLevel | null }>();

const nodes = [
  { id: "first_contribution", x: 92, y: 130, label: "première PR" },
  { id: "some_contributions", x: 172, y: 95, label: "quelques PR" },
  { id: "experienced", x: 252, y: 60, label: "aguerri" },
] as const;

const segments = [
  "M20 150 L60 150 C 76 150, 76 130, 92 130",
  " L140 130 C 156 130, 156 95, 172 95",
  " L220 95 C 236 95, 236 60, 252 60",
];
const lengths = [90, 180, 270];

const index = computed(() => nodes.findIndex((node) => node.id === props.level));
const accentPath = computed(() => segments.slice(0, index.value + 1).join(""));
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <path :d="`${segments.join('')} L300 60`" fill="none" stroke-width="1.5" class="ill-line" />
    <path
      v-if="index >= 0"
      :key="index"
      :d="accentPath"
      fill="none"
      stroke-width="2"
      class="ill-accent ill-draw"
      :style="{ '--ill-length': lengths[index] }"
    />

    <g v-for="(node, i) in nodes" :key="node.id">
      <rect
        v-if="i === index"
        :key="`pulse-${index}`"
        :x="node.x - 7"
        :y="node.y - 7"
        width="14"
        height="14"
        fill="none"
        class="ill-accent ill-pulse"
        style="animation-delay: 600ms"
      />
      <rect
        :x="node.x - 6"
        :y="node.y - 6"
        width="12"
        height="12"
        stroke-width="1.5"
        class="ill-shift"
        :class="i <= index ? 'ill-accent ill-accent-fill' : 'ill-line ill-fill'"
      />
      <text
        :x="node.x"
        :y="node.y - 16"
        text-anchor="middle"
        font-size="10"
        :class="i === index ? 'ill-text-strong' : 'ill-text'"
      >
        {{ node.label }}
      </text>
    </g>
  </svg>
</template>
