<script setup lang="ts">
import type { CommunityChecklistItem } from "~/lib/project-facts";

defineProps<{ items: CommunityChecklistItem[]; percentage: number | undefined }>();
</script>

<template>
  <section aria-labelledby="community-title" class="border-b border-default px-4 py-8 sm:px-8">
    <h2 id="community-title" class="text-lg font-medium text-highlighted">
      Accueil des contributeurs
    </h2>
    <p class="mt-1 text-sm text-muted">
      Ce que le projet met à disposition, d’après le profil communautaire GitHub ({{ percentage }}
      %).
    </p>
    <ul class="mt-5 grid gap-2 sm:grid-cols-2">
      <li
        v-for="item in items"
        :key="item.label"
        class="flex items-center gap-2.5 text-sm"
        :class="item.done ? 'text-toned' : 'text-dimmed'"
      >
        <UIcon
          :name="item.done ? 'lucide:circle-check' : 'lucide:circle-dashed'"
          class="size-4 shrink-0"
          :class="item.done ? 'text-primary' : ''"
          aria-hidden="true"
        />
        {{ item.label }}
        <span class="sr-only">{{ item.done ? "présent" : "absent" }}</span>
      </li>
    </ul>
  </section>
</template>
