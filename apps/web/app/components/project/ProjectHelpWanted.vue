<script setup lang="ts">
defineProps<{
  repositoryUrl: string;
  openIssuesCount: number;
}>();
</script>

<template>
  <div
    class="flex flex-col items-start gap-4 rounded-lg border border-secondary bg-card/20 p-5 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-sm text-lightgray">
      Ce repository compte
      <span class="font-jetbrains font-bold text-white">{{ openIssuesCount }}</span>
      issues ouvertes qui n’attendent que toi.
      <span class="text-primary">(Good First Issues)</span>
    </p>
    <UButton
      label="Voir les issues"
      color="brand"
      trailing-icon="lucide:arrow-right"
      :to="`${repositoryUrl}/issues`"
      target="_blank"
      class="shrink-0 font-bold"
    />
  </div>
</template>
