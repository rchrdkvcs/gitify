<script setup lang="ts">
import type { ExperienceLevel } from "@shared/types/index";
import { experienceLevelCatalog } from "@shared/preferences";

defineProps<{ legend: string }>();

const model = defineModel<ExperienceLevel | null>({ required: true });
</script>

<template>
  <fieldset class="flex flex-col gap-px bg-(--ui-border) p-px">
    <legend class="sr-only">{{ legend }}</legend>
    <label
      v-for="item in experienceLevelCatalog"
      :key="item.id"
      class="group relative flex cursor-pointer items-start gap-4 bg-default p-5 transition-colors duration-150 hover:bg-muted has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary sm:p-6"
    >
      <input v-model="model" type="radio" name="level" :value="item.id" class="peer sr-only" />
      <span
        class="absolute inset-0 border border-transparent transition-colors duration-150 peer-checked:border-primary"
        aria-hidden="true"
      />
      <span
        class="flex size-10 shrink-0 items-center justify-center border border-default text-muted transition-colors duration-150 group-has-checked:border-primary/50 group-has-checked:text-primary"
        aria-hidden="true"
      >
        <UIcon :name="item.icon" class="size-5" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-1.5">
        <span class="text-base font-medium text-highlighted sm:text-lg">{{ item.title }}</span>
        <span class="text-sm leading-relaxed text-muted">{{ item.description }}</span>
      </span>
      <span
        class="mt-1 flex size-4 shrink-0 items-center justify-center border border-accented transition-colors duration-150 group-has-checked:border-primary"
        aria-hidden="true"
      >
        <span
          class="size-2 scale-50 bg-primary opacity-0 transition-[opacity,scale] duration-150 group-has-checked:scale-100 group-has-checked:opacity-100"
        />
      </span>
    </label>
  </fieldset>
</template>
