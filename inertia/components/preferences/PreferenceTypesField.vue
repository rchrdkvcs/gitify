<script setup lang="ts">
import type { ContributionType } from "@shared/types/index";
import { contributionTypeCatalog } from "@shared/preferences";

const props = defineProps<{ legend: string; selected: ContributionType[] }>();
const emit = defineEmits<{ toggle: [type: ContributionType] }>();

const isSelected = (type: ContributionType) => props.selected.includes(type);
</script>

<template>
  <fieldset>
    <legend class="sr-only">{{ legend }}</legend>
    <div class="grid border-s border-t border-default sm:grid-cols-2">
      <label
        v-for="item in contributionTypeCatalog"
        :key="item.id"
        class="group relative flex cursor-pointer items-start gap-3.5 border-e border-b border-default bg-default p-4 transition-colors duration-150 hover:bg-muted has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary sm:p-5"
      >
        <input
          type="checkbox"
          class="peer sr-only"
          :checked="isSelected(item.id)"
          @change="emit('toggle', item.id)"
        />
        <span
          class="absolute -inset-px border border-transparent transition-colors duration-150 peer-checked:border-primary"
          aria-hidden="true"
        />
        <span
          class="flex size-9 shrink-0 items-center justify-center border border-default text-muted transition-colors duration-150 group-has-checked:border-primary/50 group-has-checked:text-primary"
          aria-hidden="true"
        >
          <UIcon :name="item.icon" class="size-4.5" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="font-medium text-highlighted">{{ item.title }}</span>
          <span class="text-sm leading-relaxed text-muted">{{ item.description }}</span>
        </span>
        <UIcon
          name="lucide:check"
          class="mt-0.5 size-4 shrink-0 text-primary opacity-0 transition-opacity duration-150 group-has-checked:opacity-100"
          aria-hidden="true"
        />
      </label>
    </div>
  </fieldset>
</template>
