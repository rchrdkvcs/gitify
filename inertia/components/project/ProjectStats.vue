<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import type { ProjectFacts } from "~/lib/project-facts";

type Stat = { icon: string; label: string; value: string };

const props = defineProps<{
  project: Pick<
    ProjectDetail,
    "stars" | "forksCount" | "totalContributorsCount" | "pushedAt" | "githubCreatedAt" | "insights"
  >;
  facts: Pick<ProjectFacts, "counts" | "health">;
}>();

const stats = computed(() => {
  const project = props.project;
  const insights = project.insights;
  const health = props.facts.health;
  const lastCommitAt = insights?.lastCommitAt ?? project.pushedAt;
  return [
    { icon: "lucide:star", label: "Étoiles", value: formatNumber(project.stars) },
    { icon: "lucide:git-fork", label: "Forks", value: formatNumber(project.forksCount) },
    insights && { icon: "lucide:eye", label: "Watchers", value: formatNumber(insights.watchers) },
    project.totalContributorsCount != null && {
      icon: "lucide:users",
      label: "Contributeurs",
      value: formatNumber(project.totalContributorsCount),
    },
    {
      icon: "lucide:circle-dot",
      label: "Issues ouvertes",
      value: formatNumber(props.facts.counts.openIssues),
    },
    insights && {
      icon: "lucide:git-pull-request",
      label: "PR ouvertes",
      value: formatNumber(insights.openPullRequests),
    },
    insights?.commits != null && {
      icon: "lucide:git-commit-horizontal",
      label: "Commits",
      value: formatNumber(insights.commits),
    },
    insights && { icon: "lucide:tag", label: "Releases", value: formatNumber(insights.releases) },
    insights?.diskUsageKb != null && {
      icon: "lucide:hard-drive",
      label: "Taille",
      value: formatSize(insights.diskUsageKb),
    },
    lastCommitAt && {
      icon: "lucide:clock",
      label: "Dernier commit",
      value: timeSince(lastCommitAt),
    },
    project.githubCreatedAt && {
      icon: "lucide:calendar",
      label: "Créé le",
      value: new Date(project.githubCreatedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    },
    health && {
      icon: "lucide:heart-pulse",
      label: "Santé",
      value: `${health.percentage} % · ${health.tier}`,
    },
  ].filter((stat): stat is Stat => !!stat);
});
</script>

<template>
  <section aria-labelledby="stats-title" class="border-b border-default p-5">
    <h2 id="stats-title" class="eyebrow mb-4">Statistiques</h2>
    <dl class="flex flex-col gap-2.5 text-sm">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-2.5">
        <UIcon :name="stat.icon" class="size-4 shrink-0 text-dimmed" aria-hidden="true" />
        <dt class="text-muted">{{ stat.label }}</dt>
        <span
          class="mb-1.5 flex-1 self-end border-b border-dotted border-accented"
          aria-hidden="true"
        />
        <dd class="font-mono text-xs text-highlighted tabular-nums">{{ stat.value }}</dd>
      </div>
    </dl>
  </section>
</template>
