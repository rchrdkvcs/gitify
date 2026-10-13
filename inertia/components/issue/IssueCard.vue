<script setup lang="ts">
import type { FeedIssue } from "@shared/types/index";
import { isSignalLabel } from "@shared/issues";
import { formatLanguageName } from "@shared/preferences";
import { labelSwatch } from "~/lib/label-swatch";

const props = defineProps<{ issue: FeedIssue }>();

const otherLabels = computed(() =>
  props.issue.labels.filter((label) => !isSignalLabel(label.name)),
);
const visibleLabels = computed(() => otherLabels.value.slice(0, 3));
const hiddenLabels = computed(() => otherLabels.value.length - visibleLabels.value.length);

const stats = computed(() => [
  { label: "Ouverte", value: timeSince(props.issue.createdAt) },
  { label: "Commentaires", value: formatNumber(props.issue.comments) },
  { label: "Étoiles du dépôt", value: formatNumber(props.issue.project.stars) },
]);
</script>

<template>
  <article
    class="group relative flex h-full flex-col gap-4 bg-default p-5 transition-colors duration-150 hover:bg-muted sm:p-6"
  >
    <header class="flex items-center gap-2.5">
      <img
        :src="avatarUrl(issue.project.ownerAvatarUrl, 48)"
        alt=""
        width="24"
        height="24"
        loading="lazy"
        class="size-6 shrink-0 border border-default bg-elevated object-cover"
      />
      <ULink
        :to="projectPath(issue.project)"
        class="relative z-10 min-w-0 truncate font-mono text-xs text-muted hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
        :title="`Voir le projet ${issue.project.ownerName}/${issue.project.name}`"
      >
        {{ issue.project.ownerName }}/<span class="text-toned">{{ issue.project.name }}</span>
      </ULink>
      <span
        v-if="issue.project.language"
        class="ms-auto inline-flex shrink-0 items-center gap-1.5 border border-accented px-1.5 py-0.5 font-mono text-[11px] text-toned"
      >
        <span class="size-1.5 bg-current" aria-hidden="true" />
        {{ formatLanguageName(issue.project.language) }}
      </span>
    </header>

    <h3 class="flex gap-2.5 text-[15px] leading-snug text-highlighted">
      <UIcon
        name="lucide:circle-dot"
        class="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <a
        :href="issue.url"
        target="_blank"
        rel="noopener noreferrer"
        class="line-clamp-3 outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
        :title="issue.title"
      >
        {{ issue.title }}
        <span class="sr-only">(issue #{{ issue.number }} sur GitHub)</span>
      </a>
    </h3>

    <ul class="flex flex-wrap gap-1.5 font-mono text-[11px]" aria-label="Signaux de contribution">
      <li v-if="issue.isGoodFirstIssue" class="border border-accented px-1.5 py-0.5 text-toned">
        good first issue
      </li>
      <li v-if="issue.isHelpWanted" class="border border-accented px-1.5 py-0.5 text-toned">
        help wanted
      </li>
      <li
        class="inline-flex items-center gap-1 border border-default px-1.5 py-0.5"
        :class="issue.isAssigned ? 'text-dimmed' : 'text-muted'"
      >
        <UIcon
          :name="issue.isAssigned ? 'lucide:user-check' : 'lucide:user-round-x'"
          class="size-3"
          aria-hidden="true"
        />
        {{ issue.isAssigned ? "Déjà assignée" : "Non assignée" }}
      </li>
      <li class="inline-flex items-center gap-1 border border-default px-1.5 py-0.5 text-muted">
        <UIcon name="lucide:git-pull-request-arrow" class="size-3" aria-hidden="true" />
        Sans PR liée
      </li>
    </ul>

    <div v-if="visibleLabels.length" class="flex flex-wrap gap-1.5 font-mono text-[11px]">
      <span
        v-for="label in visibleLabels"
        :key="label.name"
        class="inline-flex items-center gap-1.5 border border-default px-1.5 py-0.5 text-muted"
      >
        <span class="size-2 rounded-full" :style="labelSwatch(label.color)" aria-hidden="true" />
        {{ label.name }}
      </span>
      <span v-if="hiddenLabels" class="px-1 py-0.5 text-dimmed">+{{ hiddenLabels }}</span>
    </div>

    <dl class="mt-auto flex flex-col gap-1.5 border-t border-default pt-4 text-sm">
      <div v-for="stat in stats" :key="stat.label" class="flex items-baseline gap-2">
        <dt class="text-muted">{{ stat.label }}</dt>
        <span class="flex-1 border-b border-dotted border-accented" aria-hidden="true" />
        <dd class="font-mono text-xs text-highlighted tabular-nums">{{ stat.value }}</dd>
      </div>
    </dl>
  </article>
</template>
