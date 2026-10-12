<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import type { ProjectDetail } from "@shared/types/index";
import { Head } from "@inertiajs/vue3";
import type { ProjectTab } from "~/types/project";

const props = defineProps<{ project: ProjectDetail }>();
const project = computed(() => props.project);
const insights = computed(() => props.project.insights);

type Tab = ProjectTab;
const tabIds: Tab[] = ["overview", "contributing", "issues", "pulls", "contributors", "activity"];

const initialTab = new URLSearchParams(window.location.search).get("tab") as Tab | null;
const activeTab = ref<Tab>(initialTab && tabIds.includes(initialTab) ? initialTab : "overview");

// Tabs are client-side panels; keep the choice shareable without a server visit.
watch(activeTab, (tab) => {
  const url = new URL(window.location.href);
  if (tab === "overview") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  window.history.replaceState(window.history.state, "", url);
});

function selectTab(tab: Tab) {
  activeTab.value = tab;
  // Bring the panel into view below the sticky header and tab bar.
  nextTick(() => document.getElementById("project-tabs")?.scrollIntoView({ block: "start" }));
}

const count = (value: number | null | undefined) =>
  value != null && value > 0 ? formatCompact(value) : undefined;

const tabs = computed<TabsItem[]>(() => [
  { label: "Aperçu", value: "overview", icon: "lucide:book-open" },
  {
    label: "Contribuer",
    value: "contributing",
    icon: "lucide:hand-helping",
    badge: count(insights.value?.goodFirstIssues),
  },
  {
    label: "Issues",
    value: "issues",
    icon: "lucide:circle-dot",
    badge: count(insights.value?.openIssues ?? project.value.openIssuesCount),
  },
  {
    label: "Pull requests",
    value: "pulls",
    icon: "lucide:git-pull-request",
    badge: count(insights.value?.openPullRequests),
  },
  {
    label: "Contributeurs",
    value: "contributors",
    icon: "lucide:users",
    badge: count(project.value.totalContributorsCount),
  },
  { label: "Activité", value: "activity", icon: "lucide:chart-column" },
]);

function explainScore() {
  activeTab.value = "contributing";
  nextTick(() => document.getElementById("newcomer-breakdown")?.scrollIntoView({ block: "start" }));
}

const issueFilter = ref<"recent" | "beginner">("recent");
const issues = computed(() =>
  issueFilter.value === "beginner"
    ? (insights.value?.beginnerIssues ?? [])
    : (insights.value?.issues ?? []),
);

const communityChecklist = computed(() => {
  const files = insights.value?.health?.files;
  if (!files) return [];
  return [
    { label: "README", done: files.readme },
    { label: "Guide de contribution", done: files.contributing },
    { label: "Code de conduite", done: files.codeOfConduct },
    { label: "Licence", done: files.license },
    { label: "Modèles d’issue", done: files.issueTemplate },
    { label: "Modèle de pull request", done: files.pullRequestTemplate },
  ];
});
</script>

<template>
  <Head :title="`${project.ownerName}/${project.name}`">
    <meta v-if="project.description" name="description" :content="project.description" />
  </Head>

  <ProjectDetailHeader :project="project" />

  <FrameSection>
    <div class="lg:grid lg:grid-cols-[1fr_21rem]">
      <div class="min-w-0 lg:border-e lg:border-default">
        <div
          id="project-tabs"
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

        <!-- Aperçu -->
        <template v-if="activeTab === 'overview'">
          <ProjectOverview :project="project" @navigate="selectTab" />

          <section aria-labelledby="readme-title" class="border-b border-default">
            <h2
              id="readme-title"
              class="flex items-center gap-2 border-b border-default px-4 py-3 font-mono text-xs tracking-wider text-muted uppercase sm:px-8"
            >
              <UIcon name="lucide:book-open" class="size-4" aria-hidden="true" />
              README
            </h2>
            <div class="px-4 py-8 sm:px-8">
              <ProjectMarkdown
                v-if="project.readme"
                :source="project.readme"
                :owner-name="project.ownerName"
                :name="project.name"
                :branch="insights?.defaultBranch"
                collapsible
              />
              <EmptyState
                v-else
                icon="lucide:file-question"
                title="Pas de README"
                description="Ce projet n’a pas encore de README. Le dépôt GitHub en dira peut-être plus."
              />
            </div>
          </section>
        </template>

        <!-- Contribuer -->
        <template v-else-if="activeTab === 'contributing'">
          <section
            v-if="insights?.beginnerIssues.length"
            aria-labelledby="beginner-title"
            class="border-b border-default"
          >
            <div class="px-4 pt-8 pb-4 sm:px-8">
              <h2 id="beginner-title" class="text-lg font-medium text-highlighted">
                Issues pour débuter
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ formatNumber(insights.goodFirstIssues) }} issue{{
                  insights.goodFirstIssues > 1 ? "s" : ""
                }}
                étiquetée{{ insights.goodFirstIssues > 1 ? "s" : "" }} « good first issue » par
                l’équipe du projet.
              </p>
            </div>
            <ProjectIssueList :items="insights.beginnerIssues" kind="issue" />
          </section>

          <p
            v-else-if="insights"
            class="flex items-start gap-2 border-b border-default px-4 py-4 text-sm text-muted sm:px-8"
          >
            <UIcon name="lucide:info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Aucune issue n’est étiquetée « good first issue » pour l’instant.
              <template v-if="insights.helpWantedIssues">
                {{ formatNumber(insights.helpWantedIssues) }} issue{{
                  insights.helpWantedIssues > 1 ? "s cherchent" : " cherche"
                }}
                de l’aide (« help wanted »).
              </template>
            </span>
          </p>

          <ProjectGettingStarted :repository-url="project.repositoryUrl" :name="project.name" />

          <ProjectNewcomerBreakdown :score="project.newcomerScoreDetails" />

          <section
            v-if="communityChecklist.length"
            aria-labelledby="community-title"
            class="border-b border-default px-4 py-8 sm:px-8"
          >
            <h2 id="community-title" class="text-lg font-medium text-highlighted">
              Accueil des contributeurs
            </h2>
            <p class="mt-1 text-sm text-muted">
              Ce que le projet met à disposition, d’après le profil communautaire GitHub ({{
                insights?.health?.percentage
              }}
              %).
            </p>
            <ul class="mt-5 grid gap-2 sm:grid-cols-2">
              <li
                v-for="item in communityChecklist"
                :key="item.label"
                class="flex items-center gap-2.5 text-sm"
                :class="item.done ? 'text-toned' : 'text-dimmed'"
              >
                <UIcon
                  :name="item.done ? 'lucide:circle-check' : 'lucide:circle-dashed'"
                  class="size-4 shrink-0"
                  :class="item.done ? 'text-primary' : ''"
                  aria-hidden="true"
                />
                {{ item.label }}
                <span class="sr-only">{{ item.done ? "présent" : "absent" }}</span>
              </li>
            </ul>
          </section>

          <section v-if="project.contributing" aria-labelledby="contributing-title">
            <h2
              id="contributing-title"
              class="flex items-center gap-2 border-b border-default px-4 py-3 font-mono text-xs tracking-wider text-muted uppercase sm:px-8"
            >
              <UIcon name="lucide:file-text" class="size-4" aria-hidden="true" />
              CONTRIBUTING
            </h2>
            <div class="px-4 py-8 sm:px-8">
              <ProjectMarkdown
                :source="project.contributing"
                :owner-name="project.ownerName"
                :name="project.name"
                :branch="insights?.defaultBranch"
                collapsible
              />
            </div>
          </section>
        </template>

        <!-- Issues -->
        <section v-else-if="activeTab === 'issues'" aria-label="Issues ouvertes">
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 sm:px-8"
          >
            <UFieldGroup size="sm">
              <UButton
                label="Récentes"
                color="neutral"
                :variant="issueFilter === 'recent' ? 'subtle' : 'outline'"
                :aria-pressed="issueFilter === 'recent'"
                @click="issueFilter = 'recent'"
              />
              <UButton
                :label="`good first issue · ${insights?.goodFirstIssues ?? 0}`"
                color="neutral"
                :variant="issueFilter === 'beginner' ? 'subtle' : 'outline'"
                :aria-pressed="issueFilter === 'beginner'"
                @click="issueFilter = 'beginner'"
              />
            </UFieldGroup>
            <ULink
              :to="`${project.repositoryUrl}/issues`"
              target="_blank"
              class="inline-flex items-center gap-1 text-sm text-muted hover:text-highlighted"
            >
              Toutes sur GitHub
              <UIcon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
            </ULink>
          </div>
          <ProjectIssueList v-if="issues.length" :items="issues" kind="issue" />
          <EmptyState
            v-else
            icon="lucide:circle-check"
            :title="
              issueFilter === 'beginner' ? 'Aucune issue pour débuter' : 'Aucune issue ouverte'
            "
            description="Rien à afficher pour le moment. Jette un œil au dépôt pour d’autres façons d’aider."
          />
        </section>

        <!-- Pull requests -->
        <section v-else-if="activeTab === 'pulls'" aria-label="Pull requests ouvertes">
          <ProjectIssueList
            v-if="insights?.pullRequests.length"
            :items="insights.pullRequests"
            kind="pull"
          />
          <EmptyState
            v-else
            icon="lucide:git-pull-request"
            title="Aucune pull request ouverte"
            description="Toutes les contributions ont été traitées."
          />
          <div class="border-t border-default px-4 py-4 text-sm sm:px-8">
            <ULink
              :to="`${project.repositoryUrl}/pulls`"
              target="_blank"
              class="inline-flex items-center gap-1 text-muted hover:text-highlighted"
            >
              Toutes les pull requests sur GitHub
              <UIcon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
            </ULink>
          </div>
        </section>

        <!-- Contributeurs -->
        <section v-else-if="activeTab === 'contributors'" aria-label="Contributeurs">
          <ProjectContributors
            v-if="project.contributors.length"
            :contributors="project.contributors"
            :total="project.totalContributorsCount"
            :repository-url="project.repositoryUrl"
          />
          <EmptyState v-else icon="lucide:users" title="Aucun contributeur connu" />
        </section>

        <!-- Activité -->
        <section v-else aria-label="Activité">
          <ProjectActivity v-if="insights" :project="project" :insights="insights" />
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
          <ProjectSidebar :project="project" @explain-score="explainScore" />
        </div>
      </aside>
    </div>
  </FrameSection>
</template>
