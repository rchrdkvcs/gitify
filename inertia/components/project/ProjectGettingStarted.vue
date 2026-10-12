<script setup lang="ts">
const props = defineProps<{
  repositoryUrl: string;
  name: string;
}>();

const steps = computed(() => [
  {
    title: "Forke le dépôt",
    description: "Crée ta propre copie du projet sur ton compte GitHub.",
    link: { label: "Forker sur GitHub", to: `${props.repositoryUrl}/fork` },
  },
  {
    title: "Clone le projet",
    description:
      "Récupère le code sur ta machine. Si tu as forké, utilise plutôt l’URL de ton fork.",
    command: `git clone ${props.repositoryUrl}.git`,
  },
  {
    title: "Crée une branche",
    description: "Une branche par contribution, avec un nom qui décrit le changement.",
    command: `cd ${props.name} && git checkout -b fix/ma-contribution`,
  },
  {
    title: "Ouvre ta pull request",
    description:
      "Pousse ta branche, puis ouvre la PR en décrivant ce que tu as changé et pourquoi.",
    link: { label: "Voir les issues ouvertes", to: `${props.repositoryUrl}/issues` },
  },
]);
</script>

<template>
  <section aria-labelledby="getting-started-title" class="border-b border-default">
    <div class="px-4 pt-8 pb-2 sm:px-8">
      <h2 id="getting-started-title" class="text-lg font-medium text-highlighted">
        Pour commencer
      </h2>
    </div>
    <ol class="px-4 pb-8 sm:px-8">
      <li v-for="(step, index) in steps" :key="step.title" class="relative flex gap-4 pt-5">
        <div class="flex flex-col items-center">
          <span
            class="flex size-7 shrink-0 items-center justify-center border border-accented font-mono text-xs text-toned"
          >
            {{ index + 1 }}
          </span>
          <span
            v-if="index < steps.length - 1"
            class="-mb-5 w-px flex-1 bg-(--ui-border)"
            aria-hidden="true"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2 pb-1">
          <p class="pt-0.5 font-medium text-highlighted">{{ step.title }}</p>
          <p class="text-sm text-muted">{{ step.description }}</p>
          <div
            v-if="step.command"
            class="mt-1 flex items-center justify-between gap-3 border border-default bg-muted py-1 ps-3 pe-1"
          >
            <code class="truncate font-mono text-[13px] text-toned" :title="step.command">
              <span class="text-dimmed select-none" aria-hidden="true">$ </span>{{ step.command }}
            </code>
            <CopyButton :value="step.command" />
          </div>
          <ULink
            v-if="step.link"
            :to="step.link.to"
            target="_blank"
            class="inline-flex w-fit items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            {{ step.link.label }}
            <UIcon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
          </ULink>
        </div>
      </li>
    </ol>
  </section>
</template>
