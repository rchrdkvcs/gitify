<script setup lang="ts">
import type { ProjectDetailContributor } from "@shared/types/index";

const props = defineProps<{
  contributors: ProjectDetailContributor[];
  total: number | null;
  repositoryUrl: string;
}>();

const top = computed(() => Math.max(1, ...props.contributors.map((c) => c.contributions ?? 0)));
</script>

<template>
  <div>
    <ul class="grid gap-px bg-(--ui-border) sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="(contributor, index) in contributors" :key="contributor.id" class="bg-default">
        <a
          :href="contributor.profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <span class="w-6 shrink-0 font-mono text-xs text-dimmed tabular-nums">{{
            index + 1
          }}</span>
          <img
            :src="avatarUrl(contributor.avatarUrl, 64)"
            alt=""
            width="32"
            height="32"
            loading="lazy"
            class="size-8 shrink-0 rounded-full border border-default"
          />
          <span class="flex min-w-0 flex-1 flex-col gap-1.5">
            <span class="truncate text-sm text-highlighted">{{ contributor.login }}</span>
            <span class="h-1 bg-accented" aria-hidden="true">
              <span
                class="block h-full bg-primary/70"
                :style="{ width: `${((contributor.contributions ?? 0) / top) * 100}%` }"
              />
            </span>
          </span>
          <span
            v-if="contributor.contributions != null"
            class="font-mono text-xs text-muted tabular-nums"
          >
            {{ formatNumber(contributor.contributions) }}
            <span class="sr-only">contributions</span>
          </span>
        </a>
      </li>
    </ul>
    <div
      v-if="total && total > contributors.length"
      class="flex items-center justify-between gap-4 border-t border-default px-4 py-4 text-sm text-muted sm:px-8"
    >
      <span>{{ formatNumber(total - contributors.length) }} autres contributeurs</span>
      <ULink
        :to="`${repositoryUrl}/graphs/contributors`"
        target="_blank"
        class="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
      >
        Tout voir sur GitHub
        <UIcon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
      </ULink>
    </div>
  </div>
</template>
