<script setup lang="ts">
import type { Project, ShowcaseProject } from "@shared/types/index";

const props = defineProps<{
  project: Project | ShowcaseProject;
}>();

const emit = defineEmits<{
  favoriteChange: [projectId: string, isFavorite: boolean];
}>();

const authStore = useAuth();

const canFavorite = computed(() => "isFavorite" in props.project);
const difficulty = computed(() =>
  "difficulty" in props.project ? props.project.difficulty : null,
);

// Guests can't open the detail page (it requires a session), so their card
// leads straight to the repository on GitHub instead.
const opensDetails = computed(() => authStore.isAuthenticated);
const href = computed(() =>
  opensDetails.value ? `/projects/${props.project.id}` : props.project.repositoryUrl,
);

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
    <header class="flex items-start gap-3">
      <div
        class="flex size-10 shrink-0 items-center justify-center border border-default bg-elevated font-mono text-base text-highlighted"
        aria-hidden="true"
      >
        {{ project.name.charAt(0).toUpperCase() }}
      </div>

      <div class="min-w-0 flex-1">
        <h3 class="font-mono text-[15px] leading-snug text-highlighted">
          <ULink
            :to="href"
            :target="opensDetails ? undefined : '_blank'"
            class="block truncate outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            :title="`${project.ownerName}/${project.name}`"
          >
            <span class="text-muted">{{ project.ownerName }}/</span>{{ project.name }}
          </ULink>
        </h3>
        <p v-if="project.updatedAt" class="mt-1 truncate font-mono text-xs text-dimmed">
          Mis à jour {{ timeAgo(project.updatedAt) }}
        </p>
      </div>

      <UTooltip
        v-if="canFavorite"
        :text="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      >
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

    <div v-if="project.topics?.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="topic in project.topics.slice(0, 3)"
        :key="topic"
        class="border border-default px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-muted"
      >
        {{ topic }}
      </span>
    </div>

    <footer
      class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-default pt-4 font-mono text-xs text-muted"
    >
      <span v-if="project.language" class="inline-flex items-center gap-1.5">
        <span class="size-1.5 bg-current" aria-hidden="true" />
        {{ formatLanguage(project.language) }}
      </span>
      <span class="inline-flex items-center gap-1.5 tabular-nums">
        <UIcon name="lucide:star" class="size-3.5" aria-hidden="true" />
        {{ formatCompact(project.stars) }}
        <span class="sr-only">étoiles</span>
      </span>
      <span v-if="project.latestRelease" class="truncate">{{ project.latestRelease }}</span>
      <span
        v-if="difficulty"
        class="ms-auto border border-accented px-1.5 py-0.5 text-[11px] whitespace-nowrap text-toned"
      >
        {{ difficulty === "beginner" ? "good first issue" : "help wanted" }}
      </span>
      <UIcon
        v-else
        :name="opensDetails ? 'lucide:arrow-right' : 'lucide:arrow-up-right'"
        class="ms-auto size-4 text-dimmed transition-[translate,color] duration-150 group-hover:translate-x-0.5 group-hover:text-highlighted"
        aria-hidden="true"
      />
    </footer>
  </article>
</template>
