<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import type { ProjectFacts } from "~/lib/project-facts";
import type { ProjectTab } from "~/lib/project-tabs";

defineProps<{
  project: Pick<
    ProjectDetail,
    "contributors" | "totalContributorsCount" | "insights" | "readme" | "ownerName" | "name"
  >;
  facts: ProjectFacts;
}>();
const emit = defineEmits<{ navigate: [tab: ProjectTab] }>();
</script>

<template>
  <ProjectOverview :project="project" :facts="facts" @navigate="emit('navigate', $event)" />
  <ProjectDocument
    class="border-b border-default"
    heading-id="readme-title"
    heading="README"
    icon="lucide:book-open"
    :source="project.readme"
    :owner-name="project.ownerName"
    :name="project.name"
    :branch="project.insights?.defaultBranch"
  >
    <EmptyState
      icon="lucide:file-question"
      title="Pas de README"
      description="Ce projet n’a pas encore de README. Le dépôt GitHub en dira peut-être plus."
    />
  </ProjectDocument>
</template>
