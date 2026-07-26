<script setup lang="ts">
import type { ProjectDetailContributor } from "@gitify/types";

defineProps<{
  contributors: ProjectDetailContributor[];
}>();
</script>

<template>
  <div
    v-if="contributors.length"
    class="rounded-lg border border-secondary bg-linear-to-r from-dark to-card p-5"
  >
    <h2 class="pb-4 font-jetbrains text-lg font-bold text-white">Contributeurs</h2>
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
          class="ring-2 ring-secondary transition group-hover:ring-lightgreen"
        />
        <span class="w-full truncate text-center text-xs text-lightgreen">
          @{{ contributor.login }}
        </span>
      </a>
    </div>
  </div>
</template>
