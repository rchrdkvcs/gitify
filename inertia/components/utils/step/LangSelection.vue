<script setup lang="ts">
import type { Preference } from "~/types/preferences";

const props = defineProps<{
  items: Preference[];
  languages: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", title: string): void;
}>();

const languageId = (item: Preference) => item.value ?? item.title.toLowerCase();
const isSelected = (item: Preference) => props.languages.includes(languageId(item));
</script>

<template>
  <fieldset>
    <legend class="sr-only">Langages</legend>
    <div class="grid grid-cols-2 border-s border-t border-default sm:grid-cols-3 md:grid-cols-4">
      <label
        v-for="item in items"
        :key="item.title"
        class="group relative flex cursor-pointer items-center gap-3 border-e border-b border-default bg-default p-4 transition-colors duration-150 hover:bg-muted has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary"
      >
        <input
          type="checkbox"
          class="peer sr-only"
          :checked="isSelected(item)"
          @change="emit('toggle', languageId(item))"
        />
        <span
          class="absolute -inset-px border border-transparent peer-checked:border-primary"
          aria-hidden="true"
        />
        <span
          class="flex size-9 shrink-0 items-center justify-center border border-default font-mono text-xs text-muted group-has-checked:border-primary/50 group-has-checked:text-primary"
          aria-hidden="true"
        >
          {{ item.label || item.title }}
        </span>
        <span class="min-w-0 flex-1 truncate text-sm text-toned group-has-checked:text-highlighted">
          {{ item.title }}
        </span>
        <UIcon
          name="lucide:check"
          class="size-4 text-primary opacity-0 group-has-checked:opacity-100"
          aria-hidden="true"
        />
      </label>
    </div>
  </fieldset>
</template>
