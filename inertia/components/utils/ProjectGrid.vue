<script setup lang="ts">
// Grid of cells separated by single hairlines. Each cell draws only its
// trailing and bottom borders; the grid overhangs its frame by 1px on those
// sides so the last column and row merge into the frame's own borders.
withDefaults(defineProps<{ columns?: "2" | "3" }>(), { columns: "3" });
</script>

<template>
  <ul
    class="-me-px -mb-px grid grid-cols-1 md:grid-cols-2"
    :class="columns === '3' ? 'xl:grid-cols-3' : ''"
  >
    <slot />
  </ul>
</template>
