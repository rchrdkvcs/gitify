<script setup lang="ts">
import { Markdown } from "@comark/vue";
defineProps<{
  readme: string | null;
}>();
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-5 sm:p-8">
    <Markdown v-if="readme" :value="readme" class="readme-body" />
    <p v-else class="text-muted italic">Aucun README disponible.</p>
  </div>
</template>
