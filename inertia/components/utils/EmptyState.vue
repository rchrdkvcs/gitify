<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center px-6 py-16 text-center">
    <div
      class="mb-6 flex size-12 items-center justify-center border border-default bg-muted text-muted"
    >
      <UIcon :name="icon" class="size-5" />
    </div>
    <p class="text-lg font-medium text-highlighted">{{ title }}</p>
    <p v-if="description" class="mt-2 max-w-sm text-sm leading-relaxed text-muted">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-6 flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
