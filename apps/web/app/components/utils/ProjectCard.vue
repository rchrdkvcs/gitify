<script setup lang="ts">
import type { Project, ShowcaseProject } from "@gitify/types";

const props = defineProps<{
  project: Project | ShowcaseProject;
}>();

const emit = defineEmits<{
  favoriteChange: [projectId: string, isFavorite: boolean];
}>();

const canFavorite = computed(() => "isFavorite" in props.project);

const { isFavorite, pending, toggleFavorite } = useFavorite(
  () => ({
    id: props.project.id,
    isFavorite: "isFavorite" in props.project ? props.project.isFavorite : false,
  }),
  (value) => emit("favoriteChange", props.project.id, value),
);
</script>

<template>
  <UCard>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl font-bold"
          :class="getAvatarColor(project.language)"
        >
          {{ project.name.charAt(0).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <h3 class="truncate font-mono text-lg font-bold text-ink">
            <span class="text-muted">{{ project.ownerName }}/</span>{{ project.name }}
          </h3>
          <p class="capitalize-first mt-0.5 truncate text-xs text-gray-500">
            {{ timeAgo(project.updatedAt) }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UBadge
          v-if="project.latestRelease"
          color="neutral"
          variant="subtle"
          size="sm"
          class="rounded-full bg-surface text-xs whitespace-nowrap text-muted ring-1 ring-border"
        >
          {{ project.latestRelease }}
        </UBadge>
        <UTooltip
          v-if="canFavorite"
          :text="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        >
          <UButton
            :icon="isFavorite ? 'tabler:heart-filled' : 'tabler:heart'"
            :aria-label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            :loading="pending"
            color="secondary"
            variant="ghost"
            size="sm"
            :class="isFavorite ? 'text-red-600' : 'text-muted hover:text-red-600'"
            @click="toggleFavorite"
          />
        </UTooltip>
      </div>
    </div>

    <p class="mb-6 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
      {{ project.description || "No description provided for this repository." }}
    </p>

    <div class="mb-6 flex flex-wrap gap-2">
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        class="rounded-sm bg-yellow-500/10 text-yellow-500 capitalize ring-1 ring-yellow-500/20"
      >
        {{ project.language }}
      </UBadge>
      <UBadge
        v-for="topic in (project.topics ?? []).slice(0, 2)"
        :key="topic"
        color="neutral"
        variant="subtle"
        size="sm"
        class="rounded-sm bg-surface text-muted ring-1 ring-border"
      >
        {{ topic }}
      </UBadge>
      <UBadge
        variant="subtle"
        size="sm"
        class="rounded-sm border-green-500/20 bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
      >
        Good First Issue
      </UBadge>
    </div>

    <div class="mt-auto flex items-center justify-between border-t border-border pt-4">
      <div class="flex items-center">
        <UIcon name="tabler:star-filled" class="size-4 text-yellow-500" />
        <span class="ml-2 text-xs font-semibold text-muted"
          >+{{ project.stars.toLocaleString() }}</span
        >
      </div>

      <div class="flex items-center gap-4">
        <ULink
          :to="project.repositoryUrl"
          target="_blank"
          class="group flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-muted"
        >
          Contribuer
          <UIcon
            name="lucide:external-link"
            class="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </ULink>
        <UButton label="Voir détails" color="brand" size="lg" :to="'/projects/' + project.id" />
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.capitalize-first::first-letter {
  text-transform: uppercase;
}
</style>
