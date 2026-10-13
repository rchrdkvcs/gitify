<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import { Deferred, Head } from "@inertiajs/vue3";
import { useUrlTabs } from "~/composables/useUrlTabs";
import { projectFacts } from "~/lib/project-facts";
import { projectTabs } from "~/lib/project-tabs";

const props = defineProps<{
  project: ProjectDetail;
  detailsPending: boolean;
  details?: ProjectDetail;
}>();
const project = computed(() => props.details ?? props.project);
const facts = computed(() => projectFacts(project.value));

const tabBarId = "project-tabs";
const newcomerBreakdownId = "newcomer-breakdown";

const {
  active: activeTab,
  items: tabs,
  select: selectTab,
} = useUrlTabs(projectTabs, () => facts.value, tabBarId);

const explainScore = () => selectTab("contributing", newcomerBreakdownId);
</script>

<template>
  <Head :title="`${project.ownerName}/${project.name}`">
    <meta v-if="project.description" name="description" :content="project.description" />
  </Head>

  <ProjectDetailHeader :project="project" :difficulty-label="facts.difficultyLabel" />

  <FrameSection>
    <div class="lg:grid lg:grid-cols-[1fr_21rem]">
      <div class="min-w-0 lg:border-e lg:border-default">
        <div
          :id="tabBarId"
          class="no-scrollbar sticky top-(--ui-header-height) z-10 scroll-mt-(--ui-header-height) overflow-x-auto border-b border-default bg-default/90 backdrop-blur"
        >
          <UTabs
            v-model="activeTab"
            :items="tabs"
            :content="false"
            variant="link"
            color="neutral"
            :ui="{
              list: 'w-max min-w-full border-0 px-2 sm:px-6',
              trigger: 'shrink-0 grow-0 cursor-pointer py-3.5 font-normal',
              label: 'overflow-visible whitespace-nowrap',
            }"
          />
        </div>

        <Deferred v-if="detailsPending" data="details">
          <template #fallback>
            <ProjectDetailsSkeleton />
          </template>
          <template #rescue>
            <ProjectTabPanels
              :project="project"
              :facts="facts"
              :active-tab="activeTab"
              @navigate="selectTab"
            />
          </template>
          <ProjectTabPanels
            :project="project"
            :facts="facts"
            :active-tab="activeTab"
            @navigate="selectTab"
          />
        </Deferred>
        <ProjectTabPanels
          v-else
          :project="project"
          :facts="facts"
          :active-tab="activeTab"
          @navigate="selectTab"
        />
      </div>

      <aside
        aria-label="À propos du projet"
        class="order-first border-b border-default lg:order-none lg:border-b-0"
      >
        <div class="lg:sticky lg:top-(--ui-header-height)">
          <ProjectSidebar :project="project" :facts="facts" @explain-score="explainScore" />
        </div>
      </aside>
    </div>
  </FrameSection>
</template>
