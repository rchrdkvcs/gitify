<script setup lang="ts">
defineProps<{
  readme: string | null;
}>();
</script>

<template>
  <div class="rounded-lg border border-secondary bg-card/20 p-5 sm:p-8">
    <Comark v-if="readme" :markdown="readme" class="readme-body" />
    <p v-else class="text-lightgray italic">Aucun README disponible.</p>
  </div>
</template>
