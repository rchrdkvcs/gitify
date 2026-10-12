<script setup lang="ts">
// Step 01: the visitor picks a level, then ticks the languages they know.
const { state } = useIllustrationReveal();

const levelWidth = 93;
const levels = [
  { label: "1re PR", selected: true },
  { label: "quelques PR", selected: false },
  { label: "aguerri", selected: false },
].map((level, index) => ({ ...level, x: 20 + index * levelWidth }));

const chips = [
  { label: "TS", selected: true },
  { label: "PY", selected: false },
  { label: "RS", selected: true },
  { label: "JS", selected: false },
  { label: "GO", selected: true },
  { label: "RB", selected: false },
].map((chip, index) => ({
  ...chip,
  x: 20 + (index % 3) * 97,
  y: 102 + Math.floor(index / 3) * 36,
}));

// Languages get ticked one after another, once the level is chosen.
const tickDelay = (index: number) =>
  650 + chips.slice(0, index).filter((chip) => chip.selected).length * 220;
</script>

<template>
  <svg
    ref="illustration"
    viewBox="0 0 320 180"
    class="ill ill-motion h-auto w-full"
    :data-state="state"
    aria-hidden="true"
  >
    <text x="20" y="28" font-size="10" class="ill-text">niveau</text>
    <g v-for="level in levels" :key="level.label">
      <rect :x="level.x + 0.5" y="36.5" :width="levelWidth" height="30" class="ill-line ill-fill" />
      <text
        :x="level.x + levelWidth / 2"
        y="55.5"
        text-anchor="middle"
        font-size="11"
        class="ill-text"
      >
        {{ level.label }}
      </text>
      <g v-if="level.selected" class="ill-m-sweep" style="--ill-d: 200ms">
        <rect
          :x="level.x + 0.5"
          y="36.5"
          :width="levelWidth"
          height="30"
          class="ill-accent ill-accent-soft"
        />
        <rect :x="level.x + levelWidth - 12" y="41" width="7" height="7" class="ill-accent-fill" />
        <text
          :x="level.x + levelWidth / 2"
          y="55.5"
          text-anchor="middle"
          font-size="11"
          class="ill-text-strong"
        >
          {{ level.label }}
        </text>
      </g>
    </g>

    <text x="20" y="94" font-size="10" class="ill-text">langages</text>
    <g v-for="(chip, index) in chips" :key="chip.label">
      <rect :x="chip.x + 0.5" :y="chip.y + 0.5" width="86" height="28" class="ill-line ill-fill" />
      <rect
        :x="chip.x + 12.5"
        :y="chip.y + 10.5"
        width="8"
        height="8"
        fill="none"
        stroke-width="1.5"
        class="ill-line"
      />
      <text :x="chip.x + 30" :y="chip.y + 18.5" font-size="11" class="ill-text">
        {{ chip.label }}
      </text>

      <g v-if="chip.selected" :style="{ '--ill-d': `${tickDelay(index)}ms` }">
        <rect
          :x="chip.x + 0.5"
          :y="chip.y + 0.5"
          width="86"
          height="28"
          class="ill-m-fade ill-accent ill-accent-soft"
        />
        <text :x="chip.x + 30" :y="chip.y + 18.5" font-size="11" class="ill-m-fade ill-text-strong">
          {{ chip.label }}
        </text>
        <rect
          :x="chip.x + 12"
          :y="chip.y + 10"
          width="9"
          height="9"
          class="ill-m-pop ill-accent-fill"
        />
        <rect
          :x="chip.x + 12"
          :y="chip.y + 10"
          width="9"
          height="9"
          fill="none"
          class="ill-m-ring ill-accent"
        />
      </g>
    </g>
  </svg>
</template>
