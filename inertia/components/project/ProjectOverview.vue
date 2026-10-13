<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import { issueKindLabel } from "@shared/issues";
import type { ProjectFacts } from "~/lib/project-facts";
import type { ProjectTab } from "~/lib/project-tabs";

const props = defineProps<{
  project: Pick<ProjectDetail, "contributors" | "totalContributorsCount" | "insights">;
  facts: Pick<ProjectFacts, "counts" | "resolvedRate" | "commits" | "recentCommits">;
}>();
const emit = defineEmits<{ navigate: [tab: ProjectTab] }>();

const insights = computed(() => props.project.insights);
const recent = computed(() => props.facts.recentCommits);

const topContributors = computed(() => props.project.contributors.slice(0, 5));
const topContributions = computed(() =>
  Math.max(1, ...topContributors.value.map((c) => c.contributions ?? 0)),
);

const starterIssues = computed(() =>
  (insights.value?.beginnerIssues.length
    ? insights.value.beginnerIssues
    : (insights.value?.issues ?? [])
  ).slice(0, 3),
);
</script>

<template>
  <div class="flex flex-col divide-y divide-(--ui-border) border-b border-default">
    <ProjectPreviewPanel
      title="Comment contribuer"
      icon="lucide:hand-helping"
      action="Le guide"
      @open="emit('navigate', 'contributing')"
    >
      <dl class="mb-4 grid max-w-md grid-cols-2 gap-3">
        <div>
          <dt class="text-xs text-muted">{{ issueKindLabel("good-first-issue") }}</dt>
          <dd class="font-mono text-lg text-highlighted tabular-nums">
            {{ formatNumber(facts.counts.goodFirstIssues ?? 0) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted">{{ issueKindLabel("help-wanted") }}</dt>
          <dd class="font-mono text-lg text-highlighted tabular-nums">
            {{ formatNumber(facts.counts.helpWantedIssues ?? 0) }}
          </dd>
        </div>
      </dl>
      <p v-if="starterIssues.length" class="mb-2 text-xs text-muted">
        {{ insights?.beginnerIssues.length ? "Pour débuter" : "Issues récentes" }}
      </p>
      <ul class="flex flex-col gap-1.5">
        <li v-for="issue in starterIssues" :key="issue.number">
          <a
            :href="issue.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex gap-2 text-sm text-toned transition-colors hover:text-highlighted"
          >
            <span class="shrink-0 font-mono text-xs leading-5 text-dimmed tabular-nums">
              #{{ issue.number }}
            </span>
            <span class="line-clamp-1">{{ issue.title }}</span>
          </a>
        </li>
      </ul>
      <p v-if="!starterIssues.length" class="text-sm text-muted">
        Fork, clone, branche, pull request : les étapes sont dans le guide.
      </p>
    </ProjectPreviewPanel>

    <ProjectPreviewPanel
      title="Activité"
      icon="lucide:chart-column"
      action="Détails"
      @open="emit('navigate', 'activity')"
    >
      <dl class="mb-4 grid max-w-md grid-cols-2 gap-3">
        <div>
          <dt class="text-xs text-muted">Commits sur 12 mois</dt>
          <dd class="font-mono text-lg text-highlighted tabular-nums">
            {{ facts.commits ? formatNumber(facts.commits.total) : "—" }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted">Issues résolues</dt>
          <dd class="font-mono text-lg text-highlighted tabular-nums">
            {{ facts.resolvedRate != null ? `${facts.resolvedRate} %` : "—" }}
          </dd>
        </div>
      </dl>
      <div
        v-if="recent?.weeks.length"
        class="flex h-20 items-end gap-0.5 border-b border-accented"
        role="img"
        :aria-label="`Commits par semaine sur les 6 derniers mois, pic à ${recent.peak}`"
      >
        <div
          v-for="(count, index) in recent.weeks"
          :key="index"
          class="flex-1"
          :class="count ? 'bg-primary/60' : 'bg-accented'"
          :style="{ height: count ? `${Math.max(4, (count / recent.peak) * 100)}%` : '1px' }"
        />
      </div>
      <p v-if="recent?.weeks.length" class="mt-1.5 font-mono text-[11px] text-dimmed">
        6 derniers mois
      </p>
    </ProjectPreviewPanel>

    <ProjectPreviewPanel
      v-if="topContributors.length"
      title="Top contributeurs"
      icon="lucide:users"
      :action="
        project.totalContributorsCount
          ? `Les ${formatNumber(project.totalContributorsCount)}`
          : 'Tous'
      "
      @open="emit('navigate', 'contributors')"
    >
      <ul class="flex max-w-2xl flex-col gap-2.5">
        <li v-for="contributor in topContributors" :key="contributor.id">
          <a
            :href="contributor.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2.5 text-sm text-toned transition-colors hover:text-highlighted"
          >
            <img
              :src="avatarUrl(contributor.avatarUrl, 48)"
              alt=""
              width="24"
              height="24"
              loading="lazy"
              class="size-6 shrink-0 rounded-full border border-default"
            />
            <span class="w-28 truncate">{{ contributor.login }}</span>
            <span class="h-1 flex-1 bg-accented" aria-hidden="true">
              <span
                class="block h-full bg-primary/60"
                :style="{
                  width: `${((contributor.contributions ?? 0) / topContributions) * 100}%`,
                }"
              />
            </span>
            <span class="w-12 text-end font-mono text-xs text-muted tabular-nums">
              {{ formatCompact(contributor.contributions ?? 0) }}
            </span>
          </a>
        </li>
      </ul>
    </ProjectPreviewPanel>

    <ProjectPreviewPanel
      v-if="insights?.pullRequests.length"
      title="Pull requests récentes"
      icon="lucide:git-pull-request"
      :action="`Les ${formatCompact(insights.openPullRequests)}`"
      @open="emit('navigate', 'pulls')"
    >
      <ul class="flex flex-col gap-2.5">
        <li v-for="pull in insights.pullRequests.slice(0, 4)" :key="pull.number">
          <a
            :href="pull.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col gap-0.5 transition-colors hover:text-highlighted"
          >
            <span class="line-clamp-1 text-sm text-toned">{{ pull.title }}</span>
            <span class="font-mono text-[11px] text-dimmed">
              #{{ pull.number }} · {{ pull.author?.login ?? "inconnu" }} ·
              {{ timeSince(pull.createdAt) }}
            </span>
          </a>
        </li>
      </ul>
    </ProjectPreviewPanel>
  </div>
</template>
