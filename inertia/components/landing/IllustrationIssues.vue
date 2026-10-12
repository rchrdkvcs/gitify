<script setup lang="ts">
const rows = [
  { title: 96, label: "good first issue", accent: true, active: true },
  { title: 128, label: "help wanted", accent: false, active: false },
  { title: 80, label: "good first issue", accent: true, active: false },
];
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <rect x="16.5" y="14.5" width="287" height="151" class="ill-line ill-fill" />
    <line x1="16.5" y1="40.5" x2="303.5" y2="40.5" class="ill-line" />
    <rect x="28" y="24" width="8" height="8" class="ill-accent-fill" />
    <text x="44" y="32" font-size="10" class="ill-text">issues · open</text>

    <g v-for="(row, index) in rows" :key="index" :transform="`translate(0 ${41 + index * 41})`">
      <rect v-if="row.active" x="17" y="0" width="286" height="40" class="ill-accent-soft" />
      <rect v-if="row.active" x="17" y="0" width="2" height="40" class="ill-accent-fill" />
      <line v-if="index > 0" x1="16.5" y1="0.5" x2="303.5" y2="0.5" class="ill-faint" />
      <circle
        cx="34"
        cy="20"
        r="5"
        fill="none"
        stroke-width="1.5"
        :class="row.active ? 'ill-accent' : 'ill-line'"
      />
      <rect x="50" y="16" :width="row.title" height="8" class="ill-block" />
      <rect
        :x="296 - row.label.length * 6.2 - 12"
        y="12.5"
        :width="row.label.length * 6.2 + 12"
        height="15"
        fill="none"
        :class="row.accent ? 'ill-accent' : 'ill-line'"
      />
      <text
        :x="296 - row.label.length * 6.2 - 6"
        y="23.5"
        font-size="10"
        :class="row.accent ? 'ill-text-strong' : 'ill-text'"
      >
        {{ row.label }}
      </text>
    </g>
  </svg>
</template>
