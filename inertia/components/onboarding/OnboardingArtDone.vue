<!-- The user's branch draws in, then merges into main: their first PR, ready to happen. -->
<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <text x="20" y="62" font-size="10" class="ill-text">main</text>
    <line x1="20" y1="80" x2="300" y2="80" stroke-width="1.5" class="ill-line" />

    <path
      d="M84 80 C 104 80, 104 130, 124 130 L 196 130 C 216 130, 216 80, 236 80"
      fill="none"
      stroke-width="1.5"
      class="ill-accent ill-draw"
      style="--ill-length: 200"
    />
    <text x="128" y="154" font-size="10" class="ill-text-strong">ta-premiere-contribution</text>

    <rect x="35" y="75" width="10" height="10" class="ill-line ill-fill" stroke-width="1.5" />
    <rect x="79" y="75" width="10" height="10" class="ill-line ill-fill" stroke-width="1.5" />
    <rect x="275" y="75" width="10" height="10" class="ill-line ill-fill" stroke-width="1.5" />

    <rect
      x="140"
      y="125"
      width="10"
      height="10"
      class="ill-accent-fill ill-pop"
      style="animation-delay: 300ms"
    />
    <rect
      x="172"
      y="125"
      width="10"
      height="10"
      class="ill-accent-fill ill-pop"
      style="animation-delay: 420ms"
    />

    <rect
      x="229"
      y="73"
      width="14"
      height="14"
      fill="none"
      class="ill-accent ill-pulse"
      style="animation-delay: 750ms"
    />
    <rect
      x="229"
      y="73"
      width="14"
      height="14"
      stroke-width="2"
      class="ill-accent ill-fill ill-pop"
      style="animation-delay: 650ms"
    />

    <g class="ill-pop" style="animation-delay: 800ms">
      <line x1="236" y1="72" x2="236" y2="44" stroke-dasharray="2 3" class="ill-line" />
      <rect x="180.5" y="20.5" width="111" height="22" class="ill-accent ill-accent-soft" />
      <text x="190" y="35" font-size="10" class="ill-text-strong">PR #1 · prête</text>
    </g>
  </svg>
</template>
