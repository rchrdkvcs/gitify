<script setup lang="ts">
import type { StarSort } from "~/composables/useProjects";

defineProps<{
  languageItems: string[];
  languagesReady: boolean;
}>();

const open = defineModel<boolean>("open", { default: false });
const languages = defineModel<string[]>("languages", { default: () => [] });
const search = defineModel<string>("search", { default: "" });
const sort = defineModel<StarSort>("sort", { default: "default" });

const itemsStarSort = [
  { label: "Par défaut", value: "default" },
  { label: "Les plus appréciés", value: "most-starred" },
  { label: "Les moins appréciés", value: "least-starred" },
];

// Bloque le scroll de la page derrière le drawer ouvert (mobile)
watch(open, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = "";
  }
});
</script>

<template>
  <!-- Backdrop du drawer mobile -->
  <div v-if="open" class="fixed inset-0 z-30 bg-black/60 lg:hidden" @click="open = false" />

  <aside
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    class="fixed top-(--ui-header-height) bottom-0 left-0 z-40 w-72 shrink-0 border-r border-secondary bg-dark transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:bg-transparent lg:transition-none"
  >
    <div
      class="flex h-full flex-col px-5 py-6 lg:sticky lg:top-(--ui-header-height) lg:h-[calc(100vh-var(--ui-header-height))]"
    >
      <div class="flex-1 overflow-y-auto">
        <div class="flex items-center gap-2 pb-8 text-lightgreen/40">
          <UIcon class="size-4" name="line-md:filter" />
          <h2 class="font-grotesk text-sm font-bold uppercase">Filtres</h2>
          <UButton
            icon="lucide:x"
            color="neutral"
            variant="ghost"
            size="sm"
            class="ms-auto lg:hidden"
            @click="open = false"
          />
        </div>
        <div class="flex flex-col gap-4 pb-8">
          <p class="font-mono text-base font-bold text-white">Langage</p>
          <div v-if="!languagesReady" class="flex flex-col gap-3">
            <div v-for="n in 4" :key="n" class="flex items-center gap-2">
              <USkeleton class="size-4 rounded-xs" />
              <USkeleton class="h-4 w-24" />
            </div>
          </div>
          <UCheckboxGroup v-else v-model="languages" :items="languageItems" />
        </div>
        <div class="flex flex-col gap-4 pb-8">
          <p class="font-mono text-base font-bold text-white">Recherche</p>
          <UInput
            v-model="search"
            icon="lucide:search"
            placeholder="Nom du projet..."
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-4 pb-8">
          <p class="font-mono text-base font-bold text-white">Popularité</p>
          <USelect v-model="sort" :items="itemsStarSort" icon="lucide:star" class="w-full" />
        </div>
      </div>

      <ExploreHelpCard />
    </div>
  </aside>
</template>
