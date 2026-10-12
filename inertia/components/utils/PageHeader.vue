<script setup lang="ts">
// Header band shared by every inner page: eyebrow, title, description and
// optional actions on the trailing side.
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <FrameSection inner-class="px-4 py-10 sm:px-8 sm:py-14">
    <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div class="flex min-w-0 flex-col gap-3">
        <slot name="leading" />
        <p v-if="eyebrow" class="eyebrow">
          <span class="size-1.5 bg-primary" aria-hidden="true" />
          {{ eyebrow }}
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
          {{ title }}
        </h1>
        <p v-if="description" class="max-w-2xl text-base leading-relaxed text-muted">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap gap-3">
        <slot name="actions" />
      </div>
    </div>
  </FrameSection>
</template>
