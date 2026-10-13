<script setup lang="ts">
import { newcomerScoreSegmentCount } from "@shared/newcomer_score_display";

defineProps<{ filled: number; size?: "sm" | "md" }>();
</script>

<template>
  <span class="inline-flex gap-0.5" aria-hidden="true">
    <span
      v-for="n in newcomerScoreSegmentCount"
      :key="n"
      :class="[
        size === 'md' ? 'h-2 w-3' : 'h-1.5 w-1.5',
        n <= filled ? 'bg-primary' : 'bg-accented',
      ]"
    />
  </span>
</template>
