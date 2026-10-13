<script setup lang="ts">
useHeroCommitGraph();
</script>

<template>
  <div ref="root" class="relative isolate overflow-hidden">
    <canvas
      ref="canvas"
      aria-hidden="true"
      class="fade-edges-and-center pointer-events-none absolute inset-0 block size-full font-mono"
    />
    <div class="relative flex min-h-[inherit] items-center justify-center px-4 py-24 sm:px-8">
      <div class="flex max-w-3xl flex-col items-center text-center">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-edges-and-center {
  mask-image:
    linear-gradient(to right, transparent, black 14%, black 86%, transparent),
    radial-gradient(ellipse 42% 46% at 50% 50%, rgb(0 0 0 / 0.08) 35%, black 100%);
  mask-composite: intersect;
}
</style>
