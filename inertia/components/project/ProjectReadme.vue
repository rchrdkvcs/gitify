<script setup lang="ts">
import { Markdown } from "@comark/vue";

defineProps<{
  readme: string | null;
  repositoryUrl: string;
}>();
</script>

<template>
  <section aria-labelledby="readme-title">
    <div class="flex items-center gap-2 border-b border-default px-4 py-3 sm:px-8">
      <UIcon name="lucide:book-open" class="size-4 text-muted" aria-hidden="true" />
      <h2 id="readme-title" class="font-mono text-xs tracking-wider text-muted uppercase">
        README.md
      </h2>
    </div>
    <div class="px-4 py-8 sm:px-8">
      <!-- Markdown parses asynchronously, so it needs a Suspense boundary. -->
      <Suspense v-if="readme">
        <Markdown :value="readme" class="readme-body" />
        <template #fallback>
          <div class="flex flex-col gap-3" aria-hidden="true">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
          </div>
        </template>
      </Suspense>
      <EmptyState
        v-else
        icon="lucide:file-question"
        title="Pas de README"
        description="Ce projet n’a pas encore de README. Le dépôt GitHub en dira peut-être plus."
      >
        <UButton
          :to="repositoryUrl"
          target="_blank"
          label="Ouvrir sur GitHub"
          trailing-icon="lucide:arrow-up-right"
          color="neutral"
          variant="outline"
        />
      </EmptyState>
    </div>
  </section>
</template>
