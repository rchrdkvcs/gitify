<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import type { ProjectFacts } from "~/lib/project-facts";
import type { ProjectTab } from "~/lib/project-tabs";

const props = defineProps<{ project: ProjectDetail; facts: ProjectFacts; activeTab: ProjectTab }>();
const emit = defineEmits<{ navigate: [tab: ProjectTab] }>();
const insights = computed(() => props.project.insights);
</script>

<template>
  <p
    v-if="!insights"
    role="status"
    class="flex items-center gap-2 border-b border-default px-4 py-3 text-sm text-muted sm:px-8"
  >
    <UIcon name="lucide:info" class="size-4 shrink-0" aria-hidden="true" />
    Les statistiques détaillées de ce dépôt n’ont pas encore pu être récupérées depuis GitHub.
  </p>

  <ProjectOverviewTab
    v-if="activeTab === 'overview'"
    :project="project"
    :facts="facts"
    @navigate="emit('navigate', $event)"
  />

  <ProjectContributingTab
    v-else-if="activeTab === 'contributing'"
    :project="project"
    :facts="facts"
  />

  <ProjectIssuesTab
    v-else-if="activeTab === 'issues'"
    :insights="insights"
    :repository-url="project.repositoryUrl"
  />

  <ProjectPullsTab
    v-else-if="activeTab === 'pulls'"
    :pull-requests="insights?.pullRequests ?? []"
    :repository-url="project.repositoryUrl"
  />

  <section v-else-if="activeTab === 'contributors'" aria-label="Contributeurs">
    <ProjectContributors
      v-if="project.contributors.length"
      :contributors="project.contributors"
      :total="project.totalContributorsCount"
      :repository-url="project.repositoryUrl"
    />
    <EmptyState v-else icon="lucide:users" title="Aucun contributeur connu" />
  </section>

  <section v-else aria-label="Activité">
    <ProjectActivity v-if="insights" :insights="insights" :facts="facts" />
    <EmptyState
      v-else
      icon="lucide:chart-column"
      title="Activité indisponible"
      description="Les statistiques de ce dépôt seront disponibles à la prochaine actualisation."
    />
  </section>
</template>
