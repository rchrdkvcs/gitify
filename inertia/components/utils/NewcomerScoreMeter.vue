<script setup lang="ts">
// Ten square segments filled by tenths of the newcomer score.
const props = defineProps<{ score: number; size?: "sm" | "md" }>();

const filled = computed(() => Math.round(props.score / 10));
</script>

<template>
  <span class="inline-flex gap-0.5" aria-hidden="true">
    <span
      v-for="n in 10"
      :key="n"
      :class="[
        size === 'md' ? 'h-2 w-3' : 'h-1.5 w-1.5',
        n <= filled ? 'bg-primary' : 'bg-accented',
      ]"
    />
  </span>
</template>
