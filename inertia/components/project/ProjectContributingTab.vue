<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import type { ProjectFacts } from "~/lib/project-facts";

defineProps<{
  project: Pick<
    ProjectDetail,
    "insights" | "repositoryUrl" | "name" | "ownerName" | "contributing" | "newcomerScoreDetails"
  >;
  facts: Pick<ProjectFacts, "communityChecklist" | "health">;
}>();
</script>

<template>
  <section
    v-if="project.insights?.beginnerIssues.length"
    aria-labelledby="beginner-title"
    class="border-b border-default"
  >
    <div class="px-4 pt-8 pb-4 sm:px-8">
      <h2 id="beginner-title" class="text-lg font-medium text-highlighted">Issues pour débuter</h2>
      <p class="mt-1 text-sm text-muted">
        {{ formatNumber(project.insights.goodFirstIssues) }} issue{{
          project.insights.goodFirstIssues > 1 ? "s" : ""
        }}
        étiquetée{{ project.insights.goodFirstIssues > 1 ? "s" : "" }} « good first issue » par
        l’équipe du projet.
      </p>
    </div>
    <ProjectIssueList :items="project.insights.beginnerIssues" kind="issue" />
  </section>

  <p
    v-else-if="project.insights"
    class="flex items-start gap-2 border-b border-default px-4 py-4 text-sm text-muted sm:px-8"
  >
    <UIcon name="lucide:info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span>
      Aucune issue n’est étiquetée « good first issue » pour l’instant.
      <template v-if="project.insights.helpWantedIssues">
        {{ formatNumber(project.insights.helpWantedIssues) }} issue{{
          project.insights.helpWantedIssues > 1 ? "s cherchent" : " cherche"
        }}
        de l’aide (« help wanted »).
      </template>
    </span>
  </p>

  <ProjectGettingStarted :repository-url="project.repositoryUrl" :name="project.name" />

  <ProjectNewcomerBreakdown :score="project.newcomerScoreDetails" />

  <ProjectCommunityChecklist
    v-if="facts.communityChecklist.length"
    :items="facts.communityChecklist"
    :percentage="facts.health?.percentage"
  />

  <ProjectDocument
    v-if="project.contributing"
    heading-id="contributing-title"
    heading="CONTRIBUTING"
    icon="lucide:file-text"
    :source="project.contributing"
    :owner-name="project.ownerName"
    :name="project.name"
    :branch="project.insights?.defaultBranch"
  />
</template>
