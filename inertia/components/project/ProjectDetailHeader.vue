<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import { formatLanguageName } from "@shared/preferences";

const props = defineProps<{
  project: ProjectDetail;
  difficultyLabel: string;
}>();

const homepage = computed(() => {
  const url = props.project.homepageUrl;
  if (!url) return null;
  const href = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return { href, label: href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") };
});

const { isFavorite, pending, toggleFavorite } = useFavorite(() => props.project);
</script>

<template>
  <FrameSection inner-class="px-4 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12">
    <ULink
      to="/explore"
      class="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-highlighted"
    >
      <UIcon name="lucide:arrow-left" class="size-3.5" aria-hidden="true" />
      Explorer
    </ULink>

    <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex min-w-0 gap-5">
        <img
          :src="avatarUrl(project.ownerAvatarUrl, 160)"
          :alt="project.ownerName"
          width="80"
          height="80"
          class="size-16 shrink-0 border border-default bg-elevated object-cover sm:size-20"
        />
        <div class="flex min-w-0 flex-col gap-3">
          <div>
            <h1 class="font-mono text-2xl tracking-tight break-words text-highlighted sm:text-3xl">
              {{ project.name }}
            </h1>
            <p class="mt-1 font-mono text-sm text-muted">
              <a
                :href="`https://github.com/${project.ownerName}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-highlighted"
                >{{ project.ownerName }}</a
              ><span class="text-dimmed">/{{ project.name }}</span>
            </p>
          </div>

          <p class="max-w-2xl text-base leading-relaxed text-toned">
            {{ project.description || "Pas de description pour ce projet." }}
          </p>

          <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span
              v-if="project.insights?.isArchived"
              class="inline-flex items-center gap-1.5 border border-accented px-2 py-1 text-highlighted"
            >
              <UIcon name="lucide:archive" class="size-3.5" aria-hidden="true" />
              Archivé · plus maintenu
            </span>
            <span class="border border-accented px-2 py-1 text-toned">{{ difficultyLabel }}</span>
            <span
              v-if="project.language"
              class="inline-flex items-center gap-1.5 border border-default px-2 py-1 text-muted"
            >
              <span class="size-1.5 bg-current" aria-hidden="true" />
              {{ formatLanguageName(project.language) }}
            </span>
            <span
              v-if="project.license"
              class="inline-flex items-center gap-1.5 border border-default px-2 py-1 text-muted"
            >
              <UIcon name="lucide:scale" class="size-3.5" aria-hidden="true" />
              {{ project.license }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 border border-default px-2 py-1 text-muted tabular-nums"
            >
              <UIcon name="lucide:star" class="size-3.5" aria-hidden="true" />
              {{ formatCompact(project.stars) }}
              <span class="sr-only">étoiles</span>
            </span>
            <a
              v-if="homepage"
              :href="homepage.href"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 border border-default px-2 py-1 text-muted transition-colors hover:text-highlighted"
            >
              <UIcon name="lucide:link" class="size-3.5" aria-hidden="true" />
              {{ homepage.label }}
            </a>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap gap-3">
        <UButton
          :icon="isFavorite ? 'tabler:heart-filled' : 'tabler:heart'"
          :label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          :loading="pending"
          color="neutral"
          variant="outline"
          :ui="{ leadingIcon: isFavorite ? 'text-primary' : '' }"
          @click="toggleFavorite"
        />
        <UButton
          :to="project.repositoryUrl"
          target="_blank"
          icon="lucide:github"
          label="Voir le dépôt"
          trailing-icon="lucide:arrow-up-right"
        />
      </div>
    </div>
  </FrameSection>
</template>
