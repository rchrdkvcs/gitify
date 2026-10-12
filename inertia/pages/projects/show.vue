<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import { Head } from "@inertiajs/vue3";

const props = defineProps<{ project: ProjectDetail }>();
const project = computed(() => props.project);
</script>

<template>
  <Head :title="`${project.ownerName}/${project.name}`">
    <meta v-if="project.description" name="description" :content="project.description" />
  </Head>

  <ProjectDetailHeader :project="project" />

  <FrameSection>
    <div class="lg:grid lg:grid-cols-[1fr_20rem]">
      <div class="min-w-0 lg:border-e lg:border-default">
        <ProjectGettingStarted :repository-url="project.repositoryUrl" :name="project.name" />
        <ProjectReadme :readme="project.readme" :repository-url="project.repositoryUrl" />
      </div>
      <aside
        aria-label="À propos du projet"
        class="order-first border-b border-default lg:order-none lg:border-b-0"
      >
        <div class="lg:sticky lg:top-(--ui-header-height)">
          <ProjectSidebar :project="project" />
        </div>
      </aside>
    </div>
  </FrameSection>
</template>
