<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    description?: string;
    align?: "start" | "center";
    level?: "h1" | "h2";
  }>(),
  { align: "start", level: "h2" },
);
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="align === 'center' ? 'items-center text-center' : 'items-start'"
  >
    <p v-if="eyebrow" class="eyebrow">
      <span class="size-1.5 bg-primary" aria-hidden="true" />
      {{ eyebrow }}
    </p>
    <component :is="level" :class="level === 'h1' ? 'display' : 'section-title'" class="max-w-3xl">
      {{ title }}
    </component>
    <p v-if="description" class="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
