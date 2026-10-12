<script setup lang="ts">
import type { Preference } from "~/types/preferences";

const props = defineProps<{
  items: Preference[];
  languages: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", title: string): void;
}>();

const isSelected = (title: string) => {
  return props.languages.includes(title.toLowerCase());
};

const handleToggle = (title: string) => {
  emit("toggle", title.toLowerCase());
};
</script>

<template>
  <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    <UCard
      v-for="item in items"
      :key="item.title"
      @click="handleToggle(item.title)"
      class="preferences-card block hover:bg-surface! md:p-4"
      :class="{ 'preferences-card-active': isSelected(item.title) }"
      :ui="{ body: 'items-center gap-6' }"
    >
      <UIcon v-if="isSelected(item.title)" name="lets-icons:check-fill" class="check-icon" />
      <div class="container-icon size-12" :class="{ 'bg-primary/20': isSelected(item.title) }">
        <span
          class="font-jetbrains text-xl font-bold text-muted"
          :class="{ 'text-primary': isSelected(item.title) }"
        >
          {{ item.label || item.title }}
        </span>
      </div>
      <p class="font-medium text-muted" :class="{ 'text-ink': isSelected(item.title) }">
        {{ item.title }}
      </p>
    </UCard>
  </div>
</template>
