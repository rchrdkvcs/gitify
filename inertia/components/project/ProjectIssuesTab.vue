<script setup lang="ts">
import type { RepositoryInsights } from "@shared/types/index";
import { issueKindLabel } from "@shared/issues";

const props = defineProps<{
  insights: Pick<RepositoryInsights, "issues" | "beginnerIssues" | "goodFirstIssues"> | null;
  repositoryUrl: string;
}>();

const filter = ref<"recent" | "beginner">("recent");
const issues = computed(() =>
  filter.value === "beginner"
    ? (props.insights?.beginnerIssues ?? [])
    : (props.insights?.issues ?? []),
);
</script>

<template>
  <section aria-label="Issues ouvertes">
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 sm:px-8"
    >
      <UFieldGroup size="sm">
        <UButton
          label="Récentes"
          color="neutral"
          :variant="filter === 'recent' ? 'subtle' : 'outline'"
          :aria-pressed="filter === 'recent'"
          @click="filter = 'recent'"
        />
        <UButton
          :label="`${issueKindLabel('good-first-issue')} · ${insights?.goodFirstIssues ?? 0}`"
          color="neutral"
          :variant="filter === 'beginner' ? 'subtle' : 'outline'"
          :aria-pressed="filter === 'beginner'"
          @click="filter = 'beginner'"
        />
      </UFieldGroup>
      <ULink
        :to="`${repositoryUrl}/issues`"
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
      :title="filter === 'beginner' ? 'Aucune issue pour débuter' : 'Aucune issue ouverte'"
      description="Rien à afficher pour le moment. Jette un œil au dépôt pour d’autres façons d’aider."
    />
  </section>
</template>
