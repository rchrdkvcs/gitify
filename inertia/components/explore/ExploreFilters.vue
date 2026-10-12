<script setup lang="ts">
import type { StarSort } from "~/composables/useProjects";

defineProps<{
  languageItems: string[];
  languagesReady: boolean;
}>();

const languages = defineModel<string[]>("languages", { default: () => [] });
const sort = defineModel<StarSort>("sort", { default: "default" });

const sortItems = [
  { label: "Pertinence", value: "default" },
  { label: "Plus d’étoiles", value: "most-starred" },
  { label: "Moins d’étoiles", value: "least-starred" },
];
</script>

<template>
  <div class="flex flex-col">
    <fieldset class="flex flex-col gap-4 border-b border-default p-5">
      <legend class="eyebrow float-left mb-4 w-full">Langages</legend>
      <div v-if="!languagesReady" class="flex flex-col gap-3">
        <div v-for="n in 4" :key="n" class="flex items-center gap-2">
          <USkeleton class="size-4" />
          <USkeleton class="h-4 w-24" />
        </div>
      </div>
      <UCheckboxGroup
        v-else-if="languageItems.length"
        v-model="languages"
        :items="languageItems.map((value) => ({ value, label: formatLanguage(value) }))"
        :ui="{ fieldset: 'gap-y-2.5', label: 'text-sm text-toned' }"
      />
      <p v-else class="text-sm text-muted">Aucun langage dans tes préférences.</p>
    </fieldset>

    <fieldset class="flex flex-col border-b border-default p-5">
      <legend class="eyebrow float-left mb-4 w-full">Trier par</legend>
      <URadioGroup
        v-model="sort"
        :items="sortItems"
        :ui="{ fieldset: 'gap-y-2.5', label: 'text-sm text-toned' }"
      />
    </fieldset>

    <div class="p-5">
      <ULink
        to="/preferences"
        class="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-highlighted"
      >
        <UIcon name="lucide:sliders-horizontal" class="size-4" aria-hidden="true" />
        Modifier mes préférences
      </ULink>
    </div>
  </div>
</template>
