<script setup lang="ts">
import type { RepositoryIssue, RepositoryPullRequest } from "@shared/types/index";
import { labelSwatch } from "~/lib/label-swatch";

defineProps<{
  items: (RepositoryIssue | Partial<RepositoryPullRequest>)[];
  kind: "issue" | "pull";
}>();
</script>

<template>
  <ul class="divide-y divide-(--ui-border)">
    <li
      v-for="item in items"
      :key="item.number"
      class="group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted sm:px-8"
    >
      <UIcon
        :name="
          kind === 'pull'
            ? (item as RepositoryPullRequest).isDraft
              ? 'lucide:git-pull-request-draft'
              : 'lucide:git-pull-request'
            : 'lucide:circle-dot'
        "
        class="mt-0.5 size-4 shrink-0"
        :class="(item as RepositoryPullRequest).isDraft ? 'text-dimmed' : 'text-primary'"
        aria-hidden="true"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <a
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-highlighted outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
        >
          {{ item.title }}
        </a>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs text-muted">
          <span class="tabular-nums">#{{ item.number }}</span>
          <span v-if="item.author" class="inline-flex items-center gap-1.5">
            <img
              :src="avatarUrl(item.author.avatarUrl, 32)"
              alt=""
              width="16"
              height="16"
              loading="lazy"
              class="size-4 rounded-full"
            />
            {{ item.author.login }}
          </span>
          <span>{{ timeSince(item.createdAt ?? null) }}</span>
          <span v-if="(item as RepositoryPullRequest).isDraft">brouillon</span>
          <span v-if="item.comments" class="inline-flex items-center gap-1 tabular-nums">
            <UIcon name="lucide:message-square" class="size-3.5" aria-hidden="true" />
            {{ item.comments }}
            <span class="sr-only">commentaires</span>
          </span>
          <span
            v-for="label in item.labels ?? []"
            :key="label.name"
            class="inline-flex items-center gap-1.5 border border-default px-1.5 py-0.5 text-[11px] text-toned"
          >
            <span
              class="size-2 rounded-full"
              :style="labelSwatch(label.color)"
              aria-hidden="true"
            />
            {{ label.name }}
          </span>
        </div>
      </div>
      <UIcon
        name="lucide:arrow-up-right"
        class="mt-0.5 size-4 shrink-0 text-dimmed transition-colors group-hover:text-highlighted"
        aria-hidden="true"
      />
    </li>
  </ul>
</template>
