<script setup lang="ts">
import type { ContributionType } from "@shared/types/index";

// A contribution card whose tags light up as kinds of help are chosen.
const props = defineProps<{ selected: ContributionType[] }>();

const tags: { id: ContributionType; label: string }[] = [
  { id: "code", label: "code" },
  { id: "documentation", label: "docs" },
  { id: "tests", label: "tests" },
  { id: "translation", label: "i18n" },
  { id: "design", label: "design" },
  { id: "triage", label: "triage" },
];

const placed = computed(() =>
  tags.map((tag, index) => ({
    ...tag,
    x: 40 + (index % 3) * 84,
    y: 62 + Math.floor(index / 3) * 46,
    active: props.selected.includes(tag.id),
  })),
);
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <rect x="24.5" y="18.5" width="271" height="143" class="ill-line ill-fill" />
    <line x1="24.5" y1="44.5" x2="295.5" y2="44.5" class="ill-line" />
    <rect x="36" y="28" width="8" height="8" class="ill-accent-fill" />
    <text x="52" y="36" font-size="10" class="ill-text">contribution · ouverte</text>

    <g
      v-for="tag in placed"
      :key="tag.id"
      class="ill-shift"
      :style="{ transform: tag.active ? 'translateY(-3px)' : 'none' }"
    >
      <rect
        :x="tag.x + 0.5"
        :y="tag.y + 0.5"
        width="72"
        height="30"
        :class="tag.active ? 'ill-accent ill-accent-soft' : 'ill-line ill-fill'"
      />
      <text
        :x="tag.x + 36"
        :y="tag.y + 19"
        text-anchor="middle"
        font-size="11"
        :class="tag.active ? 'ill-text-strong' : 'ill-text'"
      >
        {{ tag.label }}
      </text>
      <rect
        v-if="tag.active"
        :x="tag.x + 62"
        :y="tag.y + 4"
        width="6"
        height="6"
        class="ill-accent-fill ill-pop"
      />
    </g>
  </svg>
</template>
