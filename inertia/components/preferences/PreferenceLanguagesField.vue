<script setup lang="ts">
import { languageCatalog } from "@shared/preferences";

const props = withDefaults(
  defineProps<{ legend: string; selected: string[]; suggested?: string[] }>(),
  { suggested: () => [] },
);
const emit = defineEmits<{ toggle: [language: string] }>();

const query = ref("");
const visible = computed(() => {
  const search = query.value.trim().toLowerCase();
  return search
    ? languageCatalog.filter(
        (item) => item.name.toLowerCase().includes(search) || item.id.includes(search),
      )
    : languageCatalog;
});

const isSelected = (id: string) => props.selected.includes(id);
</script>

<template>
  <fieldset class="flex flex-col gap-4">
    <legend class="sr-only">{{ legend }}</legend>
    <UInput
      v-model="query"
      icon="lucide:search"
      type="search"
      placeholder="Filtrer les langages…"
      aria-label="Filtrer les langages"
      class="w-full sm:max-w-xs"
    />
    <div
      v-if="visible.length"
      class="grid grid-cols-2 border-s border-t border-default sm:grid-cols-3 lg:grid-cols-4"
    >
      <label
        v-for="item in visible"
        :key="item.id"
        class="group relative flex cursor-pointer items-center gap-3 border-e border-b border-default bg-default p-3.5 transition-colors duration-150 hover:bg-muted has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary"
      >
        <input
          type="checkbox"
          class="peer sr-only"
          :checked="isSelected(item.id)"
          @change="emit('toggle', item.id)"
        />
        <span
          class="pointer-events-none absolute -inset-px border border-transparent transition-colors duration-150 peer-checked:border-primary"
          aria-hidden="true"
        />
        <UIcon
          :name="item.icon"
          class="size-5 shrink-0 text-muted transition-colors duration-150 group-has-checked:text-primary"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1 truncate text-sm text-toned group-has-checked:text-highlighted">
          {{ item.name }}
        </span>
        <span
          v-if="suggested.includes(item.id)"
          class="font-mono text-[10px] text-dimmed uppercase group-has-checked:text-primary"
        >
          suggéré<span class="sr-only"> d’après tes dépôts GitHub</span>
        </span>
        <UIcon
          v-else
          name="lucide:check"
          class="size-4 text-primary opacity-0 transition-opacity duration-150 group-has-checked:opacity-100"
          aria-hidden="true"
        />
      </label>
    </div>
    <p v-else class="text-sm text-muted">Aucun langage ne correspond à « {{ query }} ».</p>
  </fieldset>
</template>
