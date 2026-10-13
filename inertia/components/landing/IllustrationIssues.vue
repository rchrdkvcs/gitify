<script setup lang="ts">
const { state } = useIllustrationReveal();

const ROW = 41;
const SORT_AT = 350;
const SAVE_AT = 1150;

const rowsInSortedOrder = [
  { name: 104, stars: "2.4k", from: 1, saved: true },
  { name: 84, stars: "1.1k", from: 2, saved: false },
  { name: 120, stars: "380", from: 0, saved: false },
].map((row, index) => ({
  ...row,
  y: 42 + index * ROW,
  shift: (row.from - index) * ROW,
}));

const rowsClimbingToTopPaintedLast = [...rowsInSortedOrder].sort(
  (a, b) => a.shift - b.shift || b.y - a.y,
);

const STAR =
  "0,-4.5 1.12,-1.54 4.28,-1.39 1.81,0.59 2.65,3.64 0,1.9 -2.65,3.64 -1.81,0.59 -4.28,-1.39 -1.12,-1.54";
const HEART = "M284 26 L279 21 A2.9 2.9 0 0 1 284 16.9 A2.9 2.9 0 0 1 289 21 Z";
</script>

<template>
  <svg
    ref="illustration"
    viewBox="0 0 320 180"
    class="ill ill-motion h-auto w-full"
    :data-state="state"
    aria-hidden="true"
  >
    <rect x="16.5" y="14.5" width="287" height="151" class="ill-line ill-fill" />

    <circle cx="31" cy="27.5" r="4" fill="none" stroke-width="1.5" class="ill-line" />
    <line x1="34" y1="30.5" x2="37.5" y2="34" stroke-width="1.5" class="ill-line" />
    <text x="44" y="31.5" font-size="10" class="ill-text">rechercher</text>
    <rect x="150.5" y="20.5" width="40" height="15" fill="none" class="ill-accent" />
    <text x="170.5" y="31.5" text-anchor="middle" font-size="10" class="ill-text-strong">TS</text>
    <text x="292" y="31.5" text-anchor="end" font-size="10" class="ill-text">tri : étoiles</text>
    <text
      x="292"
      y="31.5"
      text-anchor="end"
      font-size="10"
      class="ill-m-fade ill-accent-fill"
      :style="{ '--ill-d': `${SORT_AT}ms` }"
    >
      tri : étoiles
    </text>
    <line x1="16.5" y1="42.5" x2="303.5" y2="42.5" class="ill-line" />

    <g
      v-for="row in rowsClimbingToTopPaintedLast"
      :key="row.stars"
      :transform="`translate(0 ${row.y})`"
    >
      <g
        class="ill-m-move"
        :style="{ '--ill-from-y': `${row.shift}px`, '--ill-d': `${SORT_AT}ms` }"
      >
        <rect x="17" y="1" width="286" height="40" class="ill-fill" />
        <rect x="28" y="13" width="15" height="15" class="ill-block" />
        <rect x="52" y="13" :width="row.name" height="7" class="ill-block" />
        <rect x="52" y="24" :width="row.name * 0.55" height="4" class="ill-block" opacity="0.6" />
        <polygon :points="STAR" transform="translate(240 20.5)" class="ill-text" />
        <text x="248" y="24" font-size="10" class="ill-text">{{ row.stars }}</text>
        <path :d="HEART" fill="none" stroke-width="1.5" class="ill-line" />
        <g v-if="row.saved" :style="{ '--ill-d': `${SAVE_AT}ms` }">
          <path :d="HEART" class="ill-m-pop ill-accent-fill" />
          <rect x="279" y="16" width="10" height="10" fill="none" class="ill-m-ring ill-accent" />
        </g>
      </g>
    </g>

    <line x1="17" y1="83.5" x2="303" y2="83.5" class="ill-faint" />
    <line x1="17" y1="124.5" x2="303" y2="124.5" class="ill-faint" />
  </svg>
</template>
