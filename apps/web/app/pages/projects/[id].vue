<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const { project, loading, error, fetchProject } = useProjectDetail(route.params.id as string);

onMounted(fetchProject);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <div v-if="loading" class="flex flex-col gap-6">
      <USkeleton class="h-4 w-64" />
      <USkeleton class="h-10 w-96 max-w-full" />
      <USkeleton class="h-16 w-full max-w-2xl" />
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <USkeleton class="h-96 lg:col-span-2" />
        <USkeleton class="h-64" />
      </div>
    </div>

    <div v-else-if="error" class="flex flex-col items-center gap-6 py-24 text-center">
      <UIcon name="lucide:git-pull-request-closed" class="size-12 text-primary" />
      <p class="font-jetbrains text-lg text-lightgray">{{ error }}</p>
      <UButton label="Retour à l’exploration" color="secondary" to="/explore" />
    </div>

    <template v-else-if="project">
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
    </template>
  </div>
</template>
