<script setup lang="ts">
const { state } = useIllustrationReveal();

const DRAW_AT = 150;
const DRAW_FOR = 1100;
const whenTraceReachesShare = (share: number) => `${Math.round(DRAW_AT + DRAW_FOR * share)}ms`;
</script>

<template>
  <svg
    ref="illustration"
    viewBox="0 0 320 180"
    class="ill ill-motion h-auto w-full"
    :data-state="state"
    aria-hidden="true"
  >
    <text x="20" y="66" font-size="10" class="ill-text">main</text>
    <line x1="20" y1="80" x2="300" y2="80" stroke-width="1.5" class="ill-line" />
    <rect x="35.5" y="75.5" width="9" height="9" stroke-width="1.5" class="ill-line ill-fill" />
    <rect x="79.5" y="75.5" width="9" height="9" stroke-width="1.5" class="ill-line ill-fill" />
    <rect x="275.5" y="75.5" width="9" height="9" stroke-width="1.5" class="ill-line ill-fill" />

    <path
      d="M84 80 C 104 80, 104 128, 124 128 L 196 128 C 216 128, 216 80, 236 80"
      pathLength="1"
      fill="none"
      stroke-width="1.5"
      class="ill-m-draw ill-accent"
      :style="{ '--ill-d': `${DRAW_AT}ms`, '--ill-t': `${DRAW_FOR}ms` }"
    />
    <text
      x="160"
      y="154"
      text-anchor="middle"
      font-size="10"
      class="ill-m-fade ill-text-strong"
      :style="{ '--ill-d': whenTraceReachesShare(0.3) }"
    >
      fix/typo-readme
    </text>
    <g :style="{ '--ill-d': whenTraceReachesShare(0.42) }">
      <rect x="140" y="123" width="10" height="10" class="ill-m-pop ill-accent-fill" />
      <rect x="140" y="123" width="10" height="10" fill="none" class="ill-m-ring ill-accent" />
    </g>
    <g :style="{ '--ill-d': whenTraceReachesShare(0.58) }">
      <rect x="172" y="123" width="10" height="10" class="ill-m-pop ill-accent-fill" />
      <rect x="172" y="123" width="10" height="10" fill="none" class="ill-m-ring ill-accent" />
    </g>

    <g :style="{ '--ill-d': whenTraceReachesShare(1) }">
      <rect
        x="229"
        y="73"
        width="14"
        height="14"
        stroke-width="2"
        class="ill-m-pop ill-accent ill-accent-fill"
      />
      <rect x="229" y="73" width="14" height="14" fill="none" class="ill-m-ring ill-accent" />
    </g>

    <g class="ill-m-rise" :style="{ '--ill-d': whenTraceReachesShare(1.15) }">
      <line x1="236" y1="44" x2="236" y2="70" class="ill-line" />
      <rect x="184.5" y="20.5" width="103" height="23" class="ill-accent ill-accent-soft" />
      <text x="236" y="35.5" text-anchor="middle" font-size="10" class="ill-text-strong">
        PR #42 merged
      </text>
    </g>
  </svg>
</template>
