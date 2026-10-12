<script setup lang="ts">
const chips = [
  { label: "TS", selected: true },
  { label: "PY", selected: false },
  { label: "RS", selected: true },
  { label: "JS", selected: false },
  { label: "GO", selected: true },
  { label: "RB", selected: false },
  { label: "KT", selected: false },
  { label: "PHP", selected: false },
  { label: "C++", selected: false },
].map((chip, index) => ({
  ...chip,
  x: 22 + (index % 3) * 96,
  y: 22 + Math.floor(index / 3) * 52,
}));
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <g v-for="chip in chips" :key="chip.label">
      <rect
        :x="chip.x + 0.5"
        :y="chip.y + 0.5"
        width="84"
        height="36"
        :class="chip.selected ? 'ill-accent ill-accent-soft' : 'ill-line ill-fill'"
      />
      <text
        :x="chip.x + 42"
        :y="chip.y + 23"
        text-anchor="middle"
        font-size="12"
        :class="chip.selected ? 'ill-text-strong' : 'ill-text'"
      >
        {{ chip.label }}
      </text>
      <g v-if="chip.selected">
        <rect :x="chip.x + 72" :y="chip.y + 4" width="8" height="8" class="ill-accent-fill" />
      </g>
    </g>
  </svg>
</template>
