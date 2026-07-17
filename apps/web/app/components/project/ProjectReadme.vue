<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";

const props = defineProps<{
  readme: string | null;
}>();

const renderedReadme = computed(() => {
  if (!props.readme) return null;
  return DOMPurify.sanitize(marked.parse(props.readme) as string);
});
</script>

<template>
  <div class="rounded-lg border border-secondary bg-card/20 p-5 sm:p-8">
    <div v-if="renderedReadme" v-html="renderedReadme" class="readme-body" />
    <p v-else class="text-lightgray italic">Aucun README disponible.</p>
  </div>
</template>