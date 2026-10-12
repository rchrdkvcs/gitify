<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
const props = defineProps<{ project: ProjectDetail }>();
const project = computed(() => props.project);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <ProjectDetailHeader :project="project" />

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div class="flex flex-col gap-8 lg:col-span-2">
        <ProjectGettingStarted :repository-url="project.repositoryUrl" />
        <ProjectContentTabs
          :readme="project.readme"
          :repository-url="project.repositoryUrl"
          :open-issues-count="project.openIssuesCount"
        />
      </div>

      <div class="flex flex-col gap-6">
        <ProjectStatsCard :project="project" class="hidden lg:block" />
        <ProjectLanguagesCard :languages="project.languages" />
        <ProjectContributorsCard :contributors="project.contributors" />
        <ProjectInfoCard :project="project" />
      </div>
    </div>
  </div>
</template>
