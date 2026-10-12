<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

const props = defineProps<{
  readme: string | null;
  repositoryUrl: string;
  openIssuesCount: number;
}>();

const items = computed<TabsItem[]>(() => [
  {
    label: "Readme",
    icon: "lucide:book-marked",
    value: "readme",
    slot: "readme",
  },
  {
    label: "Help Wanted",
    icon: "lucide:heart-handshake",
    value: "help-wanted",
    slot: "help-wanted",
    badge: {
      label: String(props.openIssuesCount),
      class: "rounded-full bg-primary/20 text-primary ring-0 border-0 font-jetbrains",
    },
  },
]);
</script>

<template>
  <UTabs
    :items="items"
    default-value="readme"
    variant="link"
    :ui="{
      list: 'gap-2 border-border',
      indicator: 'h-0.5 bg-primary',
      trigger:
        'px-3 py-2.5 font-grotesk text-sm font-bold tracking-widest uppercase data-[state=inactive]:text-muted hover:data-[state=inactive]:text-brand-green data-[state=active]:text-ink',
      content: 'pt-6',
    }"
  >
    <template #readme>
      <ProjectReadme :readme="readme" />
    </template>
    <template #help-wanted>
      <ProjectHelpWanted :repository-url="repositoryUrl" :open-issues-count="openIssuesCount" />
    </template>
  </UTabs>
</template>
