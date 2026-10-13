<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import { Head } from "@inertiajs/vue3";
import { useUrlTabs } from "~/composables/useUrlTabs";
import { projectFacts } from "~/lib/project-facts";
import { projectTabs } from "~/lib/project-tabs";

const props = defineProps<{ project: ProjectDetail }>();
const project = computed(() => props.project);
const insights = computed(() => props.project.insights);
const facts = computed(() => projectFacts(props.project));

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
          @navigate="selectTab"
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
