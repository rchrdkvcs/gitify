<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";

const props = defineProps<{
  project: ProjectDetail;
}>();

const stats = computed(() => [
  { label: "Étoiles", value: formatCompact(props.project.stars) },
  { label: "Forks", value: formatCompact(props.project.forksCount) },
  { label: "Issues ouvertes", value: formatCompact(props.project.openIssuesCount) },
  {
    label: "Contributeurs",
    value:
      props.project.totalContributorsCount != null
        ? formatCompact(props.project.totalContributorsCount)
        : "—",
  },
]);

const languages = computed(() => {
  if (!props.project.languages) return [];
  const entries = Object.entries(props.project.languages);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];
  return entries
    .map(([name, bytes]) => ({ name, percent: (bytes / total) * 100 }))
    .filter((lang) => lang.percent >= 0.5)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);
});

const formatPercent = (value: number) =>
  `${value.toLocaleString("fr-FR", { maximumFractionDigits: value < 10 ? 1 : 0 })} %`;
</script>

<template>
  <div class="flex flex-col">
    <section aria-label="Statistiques" class="border-b border-default">
      <dl class="grid grid-cols-2 gap-px bg-(--ui-border)">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col-reverse gap-1 bg-default p-5"
        >
          <dt class="text-xs text-muted">{{ stat.label }}</dt>
          <dd class="font-mono text-xl text-highlighted tabular-nums">{{ stat.value }}</dd>
        </div>
      </dl>
    </section>

    <section
      v-if="languages.length"
      aria-labelledby="languages-title"
      class="border-b border-default p-5"
    >
      <h2 id="languages-title" class="eyebrow mb-4">Langages</h2>
      <ul class="flex flex-col gap-3">
        <li v-for="lang in languages" :key="lang.name" class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-toned">{{ lang.name }}</span>
            <span class="font-mono text-xs text-muted tabular-nums">
              {{ formatPercent(lang.percent) }}
            </span>
          </div>
          <div class="h-1 bg-accented" aria-hidden="true">
            <div class="h-full bg-(--ui-text-toned)" :style="{ width: `${lang.percent}%` }" />
          </div>
        </li>
      </ul>
    </section>

    <section
      v-if="project.contributors.length"
      aria-labelledby="contributors-title"
      class="border-b border-default p-5"
    >
      <h2 id="contributors-title" class="eyebrow mb-4">Principaux contributeurs</h2>
      <ul class="flex flex-col">
        <li v-for="contributor in project.contributors.slice(0, 6)" :key="contributor.id">
          <a
            :href="contributor.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="-mx-2 flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UAvatar :src="contributor.avatarUrl" alt="" size="xs" />
            <span class="min-w-0 flex-1 truncate text-sm text-toned">{{ contributor.login }}</span>
            <span
              v-if="contributor.contributions != null"
              class="font-mono text-xs text-muted tabular-nums"
            >
              {{ formatCompact(contributor.contributions) }}
              <span class="sr-only">contributions</span>
            </span>
          </a>
        </li>
      </ul>
    </section>

    <section aria-labelledby="infos-title" class="p-5">
      <h2 id="infos-title" class="eyebrow mb-4">Infos</h2>
      <dl class="flex flex-col gap-2.5 text-sm">
        <div v-if="project.latestRelease" class="flex items-center justify-between gap-4">
          <dt class="text-muted">Dernière version</dt>
          <dd class="truncate font-mono text-xs text-toned">{{ project.latestRelease }}</dd>
        </div>
        <div v-if="project.createdAt" class="flex items-center justify-between gap-4">
          <dt class="text-muted">Créé le</dt>
          <dd class="font-mono text-xs text-toned">{{ formatDate(project.createdAt) }}</dd>
        </div>
        <div v-if="project.updatedAt" class="flex items-center justify-between gap-4">
          <dt class="text-muted">Mis à jour</dt>
          <dd class="font-mono text-xs text-toned">{{ timeAgo(project.updatedAt) }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
