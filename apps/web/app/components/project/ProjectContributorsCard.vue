<script setup lang="ts">
import type { ProjectDetailContributor } from "@gitify/types";

defineProps<{
  contributors: ProjectDetailContributor[];
}>();
</script>

<template>
  <div
    v-if="contributors.length"
    class="rounded-lg border border-border bg-linear-to-r from-canvas to-surface p-5"
  >
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-ink">Contributeurs</h2>
    <div class="grid grid-cols-3 gap-4">
      <a
        v-for="contributor in contributors.slice(0, 6)"
        :key="contributor.id"
        :href="contributor.profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="group flex flex-col items-center gap-2"
      >
        <UAvatar
          :src="contributor.avatarUrl"
          :alt="contributor.login"
          size="2xl"
          class="ring-2 ring-border transition group-hover:ring-brand-green"
        />
        <span class="w-full truncate text-center text-xs text-brand-green">
          @{{ contributor.login }}
        </span>
      </a>
    </div>
  </div>
</template>
