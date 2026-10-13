<script setup lang="ts">
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
