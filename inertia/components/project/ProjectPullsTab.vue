<script setup lang="ts">
import type { RepositoryPullRequest } from "@shared/types/index";

defineProps<{ pullRequests: RepositoryPullRequest[]; repositoryUrl: string }>();
</script>

<template>
  <section aria-label="Pull requests ouvertes">
    <ProjectIssueList v-if="pullRequests.length" :items="pullRequests" kind="pull" />
    <EmptyState
      v-else
      icon="lucide:git-pull-request"
      title="Aucune pull request ouverte"
      description="Toutes les contributions ont été traitées."
    />
    <div class="border-t border-default px-4 py-4 text-sm sm:px-8">
      <ULink
        :to="`${repositoryUrl}/pulls`"
        target="_blank"
        class="inline-flex items-center gap-1 text-muted hover:text-highlighted"
      >
        Toutes les pull requests sur GitHub
        <UIcon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
      </ULink>
    </div>
  </section>
</template>
