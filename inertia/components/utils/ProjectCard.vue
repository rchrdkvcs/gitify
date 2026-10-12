<script setup lang="ts">
import type { Project, ShowcaseProject } from "@shared/types/index";

const props = defineProps<{
  project: Project | ShowcaseProject;
}>();

const emit = defineEmits<{
  favoriteChange: [projectId: string, isFavorite: boolean];
}>();

const difficulty = computed(() =>
  "difficulty" in props.project ? props.project.difficulty : null,
);

const stats = computed(() => {
  const project = props.project;
  return [
    { label: "Étoiles", value: formatNumber(project.stars) },
    "openIssuesCount" in project
      ? { label: "Issues ouvertes", value: formatNumber(project.openIssuesCount) }
      : null,
    "forksCount" in project ? { label: "Forks", value: formatNumber(project.forksCount) } : null,
    project.pushedAt ? { label: "Dernier commit", value: timeSince(project.pushedAt) } : null,
  ].filter((stat) => stat !== null);
});

const { isFavorite, pending, toggleFavorite } = useFavorite(
  () => ({
    id: props.project.id,
    isFavorite: "isFavorite" in props.project ? props.project.isFavorite : false,
  }),
  (value) => emit("favoriteChange", props.project.id, value),
);
</script>

<template>
  <article
    class="group relative flex h-full flex-col gap-5 bg-default p-5 transition-colors duration-150 hover:bg-muted sm:p-6"
  >
    <header class="flex items-start gap-3.5">
      <img
        :src="avatarUrl(project.ownerAvatarUrl, 96)"
        alt=""
        width="48"
        height="48"
        loading="lazy"
        class="size-12 shrink-0 border border-default bg-elevated object-cover"
      />

      <div class="min-w-0 flex-1">
        <h3 class="font-mono text-[15px] leading-snug text-highlighted">
          <ULink
            :to="projectPath(project)"
            class="block truncate outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            :title="`${project.ownerName}/${project.name}`"
          >
            {{ project.name }}
          </ULink>
        </h3>
        <p class="mt-0.5 truncate font-mono text-xs text-dimmed">{{ project.ownerName }}</p>
      </div>

      <UTooltip :text="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
        <UButton
          :icon="isFavorite ? 'tabler:heart-filled' : 'tabler:heart'"
          :aria-label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          :loading="pending"
          color="neutral"
          variant="ghost"
          size="sm"
          class="relative z-10 -mt-1 -mr-1.5"
          :class="isFavorite ? 'text-primary' : 'text-muted'"
          @click="toggleFavorite"
        />
      </UTooltip>
    </header>

    <p
      class="line-clamp-2 min-h-[2lh] text-sm leading-relaxed text-muted"
      :title="project.description ?? undefined"
    >
      {{ project.description || "Pas de description pour ce projet." }}
    </p>

    <div class="flex flex-wrap gap-1.5 font-mono text-[11px]">
      <span
        v-if="project.language"
        class="inline-flex items-center gap-1.5 border border-accented px-1.5 py-0.5 text-toned"
      >
        <span class="size-1.5 bg-current" aria-hidden="true" />
        {{ formatLanguage(project.language) }}
      </span>
      <span v-if="difficulty" class="border border-accented px-1.5 py-0.5 text-toned">
        {{ difficulty === "beginner" ? "good first issue" : "help wanted" }}
      </span>
      <span
        v-for="topic in (project.topics ?? []).slice(0, 2)"
        :key="topic"
        class="border border-default px-1.5 py-0.5 whitespace-nowrap text-muted"
      >
        {{ topic }}
      </span>
    </div>

    <dl class="mt-auto flex flex-col gap-1.5 border-t border-default pt-4 text-sm">
      <div v-for="stat in stats" :key="stat.label" class="flex items-baseline gap-2">
        <dt class="text-muted">{{ stat.label }}</dt>
        <span class="flex-1 border-b border-dotted border-accented" aria-hidden="true" />
        <dd class="font-mono text-xs text-highlighted tabular-nums">{{ stat.value }}</dd>
      </div>
    </dl>
  </article>
</template>
