<script setup lang="ts">
import type { Preference } from "~/types/preferences";

defineProps<{
  items: Preference[];
}>();

const model = defineModel<"beginner" | "expert">();

const handleSelection = (label: string | undefined) => {
  model.value = label as "beginner" | "expert";
};
</script>

<template>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <article
      v-for="item in items"
      :key="item.title"
      @click="handleSelection(item.label)"
      class="preferences-card hover:bg-card/30!"
      :class="{ 'preferences-card-active': model === item.label }"
    >
      <UIcon v-if="model === item.label" name="lets-icons:check-fill" class="check-icon" />
      <div class="container-icon" :class="{ 'bg-primary/20': model === item.label }">
        <UIcon
          v-if="item.icon"
          :name="item.icon"
          class="icon"
          :class="{ 'text-primary': model === item.label }"
        />
      </div>
      <div class="flex flex-col space-y-3">
        <h3 class="text-lg font-semibold md:text-2xl">{{ item.title }}</h3>
        <p class="text-sm text-lightgray md:text-base">{{ item.description }}</p>
      </div>
    </article>
  </div>
</template>
