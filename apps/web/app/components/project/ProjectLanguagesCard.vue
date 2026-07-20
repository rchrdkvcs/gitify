<script setup lang="ts">
const props = defineProps<{
  languages: Record<string, number> | null;
}>();

const languagesWithPercent = computed(() => {
  if (!props.languages) return [];
  const total = Object.values(props.languages).reduce((a, b) => a + b, 0);
  return Object.entries(props.languages)
    .map(([name, bytes]) => ({
      name,
      percent: Math.round((bytes / total) * 100),
    }))
    .filter((lang) => lang.percent > 0);
});
</script>

<template>
  <div
    v-if="languagesWithPercent.length"
    class="rounded-lg border border-secondary bg-linear-to-r from-dark to-card p-5"
  >
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-white">Langages</h2>
    <div class="flex flex-col gap-3">
      <div v-for="lang in languagesWithPercent" :key="lang.name">
        <div class="flex items-center justify-between pb-1 text-sm">
          <span class="text-white">{{ lang.name }}</span>
          <span class="font-jetbrains text-lightgray">{{ lang.percent }}%</span>
        </div>
        <UProgress
          :model-value="lang.percent"
          size="sm"
          :ui="{ base: 'bg-dark', indicator: 'bg-lightgreen' }"
        />
      </div>
    </div>
  </div>
</template>
