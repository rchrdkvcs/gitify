<script setup lang="ts">
import type { ProjectDetail } from "@shared/types/index";
import type { ProjectFacts } from "~/lib/project-facts";

const props = defineProps<{
  project: ProjectDetail;
  facts: Pick<ProjectFacts, "counts" | "health">;
}>();
const emit = defineEmits<{ explainScore: [] }>();

const links = computed(() =>
  [
    projectLink("Dépôt GitHub", props.project.repositoryUrl, "lucide:github"),
    projectLink("Issues", `${props.project.repositoryUrl}/issues`, "lucide:circle-dot"),
    projectLink("Pull requests", `${props.project.repositoryUrl}/pulls`, "lucide:git-pull-request"),
    props.project.latestRelease &&
      projectLink(
        `Release ${props.project.latestRelease}`,
        `${props.project.repositoryUrl}/releases/latest`,
        "lucide:tag",
      ),
  ].filter((link) => !!link),
);

function projectLink(label: string, href: string, icon: string) {
  return { label, href, icon };
}
</script>

<template>
  <div class="flex flex-col [&>section:last-child]:border-b-0">
    <ProjectNewcomerScore :score="project.newcomerScoreDetails" @explain="emit('explainScore')" />

    <ProjectStats :project="project" :facts="facts" />

    <section aria-labelledby="links-title" class="border-b border-default p-5">
      <h2 id="links-title" class="eyebrow mb-4">Liens</h2>
      <ul class="flex flex-col gap-2 text-sm">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-toned transition-colors hover:text-highlighted"
          >
            <UIcon :name="link.icon" class="size-4 text-dimmed" aria-hidden="true" />
            {{ link.label }}
            <UIcon name="lucide:arrow-up-right" class="size-3.5 text-dimmed" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>

    <section
      v-if="project.insights?.languages.length"
      aria-labelledby="stack-title"
      class="border-b border-default p-5"
    >
      <h2 id="stack-title" class="eyebrow mb-4">Stack technique</h2>
      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="language in project.insights.languages"
          :key="language.name"
          class="inline-flex items-center gap-1.5 border border-default px-2 py-1 font-mono text-xs text-toned"
        >
          <span
            class="size-2 rounded-full"
            :style="{ backgroundColor: language.color ?? 'var(--ui-text-dimmed)' }"
            aria-hidden="true"
          />
          {{ language.name }}
        </li>
      </ul>
    </section>

    <section
      v-if="project.topics?.length"
      aria-labelledby="topics-title"
      class="border-b border-default p-5"
    >
      <h2 id="topics-title" class="eyebrow mb-4">Sujets</h2>
      <ul class="flex flex-wrap gap-1.5">
        <li v-for="topic in project.topics" :key="topic">
          <ULink
            :to="`/explore?topic=${encodeURIComponent(topic)}&level=all`"
            class="block border border-default px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-accented hover:text-highlighted"
          >
            {{ topic }}
          </ULink>
        </li>
      </ul>
    </section>

    <section
      v-if="project.contributors.length"
      aria-labelledby="contributors-preview-title"
      class="border-b border-default p-5"
    >
      <h2 id="contributors-preview-title" class="eyebrow mb-4">Contributeurs</h2>
      <ul class="flex flex-wrap gap-1.5">
        <li v-for="contributor in project.contributors.slice(0, 18)" :key="contributor.id">
          <UTooltip :text="contributor.login">
            <a :href="contributor.profileUrl" target="_blank" rel="noopener noreferrer">
              <img
                :src="avatarUrl(contributor.avatarUrl, 64)"
                :alt="contributor.login"
                width="32"
                height="32"
                loading="lazy"
                class="size-8 rounded-full border border-default transition-transform hover:-translate-y-0.5"
              />
            </a>
          </UTooltip>
        </li>
      </ul>
    </section>
  </div>
</template>
