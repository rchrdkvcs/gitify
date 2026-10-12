<script setup lang="ts">
import type { Preference } from "~/types/preferences";

defineProps<{
  items: Preference[];
}>();

const model = defineModel<"beginner" | "expert" | null>();
</script>

<template>
  <fieldset class="grid gap-px bg-(--ui-border) p-px sm:grid-cols-2">
    <legend class="sr-only">Niveau</legend>
    <label
      v-for="item in items"
      :key="item.title"
      class="group relative flex cursor-pointer flex-col gap-4 bg-default p-6 transition-colors duration-150 hover:bg-muted has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary"
    >
      <input
        v-model="model"
        type="radio"
        name="difficulty"
        :value="item.label"
        class="peer sr-only"
      />
      <span
        class="absolute inset-0 border border-transparent peer-checked:border-primary"
        aria-hidden="true"
      />
      <div class="flex items-center justify-between">
        <span
          class="flex size-10 items-center justify-center border border-default text-muted group-has-checked:border-primary/50 group-has-checked:text-primary"
        >
          <UIcon v-if="item.icon" :name="item.icon" class="size-5" aria-hidden="true" />
        </span>
        <span
          class="flex size-4 items-center justify-center border border-accented group-has-checked:border-primary"
          aria-hidden="true"
        >
          <span class="size-2 bg-primary opacity-0 group-has-checked:opacity-100" />
        </span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-lg font-medium text-highlighted">{{ item.title }}</span>
        <span class="text-sm leading-relaxed text-muted">{{ item.description }}</span>
      </div>
    </label>
  </fieldset>
</template>
