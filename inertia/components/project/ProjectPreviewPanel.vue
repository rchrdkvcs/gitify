<script setup lang="ts">
defineProps<{
  title: string;
  icon: string;
  action: string;
}>();

defineEmits<{ open: [] }>();
</script>

<template>
  <section class="flex flex-col bg-default">
    <header class="flex items-center justify-between gap-3 px-4 pt-6 pb-4 sm:px-8">
      <h2 class="inline-flex items-center gap-2 text-sm font-medium text-highlighted">
        <UIcon :name="icon" class="size-4 text-muted" aria-hidden="true" />
        {{ title }}
      </h2>
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-1 font-mono text-xs text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
        @click="$emit('open')"
      >
        {{ action }}
        <UIcon name="lucide:arrow-right" class="size-3.5" aria-hidden="true" />
      </button>
    </header>
    <div class="flex-1 px-4 pb-6 sm:px-8">
      <slot />
    </div>
  </section>
</template>
