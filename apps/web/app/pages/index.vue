<script setup lang="ts">
import { healthQuery } from "~/queries/health";

const healthStore = useHealthStore();
const { data: health, state: healthState } = useQuery(healthQuery);

watch(healthState, (newState) => {
  healthStore.setHealth({
    data: health.value,
    state: newState,
  });
});
</script>

<template>
  <UContainer class="flex items-center justify-center py-4">
    <div v-if="healthState.status === 'pending'" class="text-2xl">Loading...</div>

    <div v-else class="text-2xl">
      {{ health }}
    </div>
  </UContainer>
</template>
