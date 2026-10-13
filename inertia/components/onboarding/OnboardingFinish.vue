<script setup lang="ts">
import type { UserPreferences } from "@shared/types/index";
import {
  contributionTypeCatalog,
  experienceLevelCatalog,
  formatLanguageName,
} from "@shared/preferences";
import { confettiBurst } from "~/lib/confetti";

const props = defineProps<{ preferences: UserPreferences }>();

const heading = useTemplateRef<HTMLElement>("heading");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const showConfetti = ref(true);

const summary = computed(() => [
  {
    label: "Niveau",
    value: experienceLevelCatalog.find((item) => item.id === props.preferences.level)?.title,
  },
  {
    label: "Contributions",
    value: props.preferences.contributionTypes.length
      ? contributionTypeCatalog
          .filter((item) => props.preferences.contributionTypes.includes(item.id))
          .map((item) => item.title)
          .join(", ")
      : "Toutes",
  },
  {
    label: "Langages",
    value: props.preferences.languages.length
      ? props.preferences.languages.map(formatLanguageName).join(", ")
      : "Tous",
  },
  {
    label: "Sujets",
    value: props.preferences.topics.length ? props.preferences.topics.join(", ") : "Aucun",
  },
]);

let cancel: (() => void) | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  heading.value?.focus();
  if (!canvas.value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showConfetti.value = false;
    return;
  }
  const styles = getComputedStyle(canvas.value);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  cancel = confettiBurst(canvas.value, {
    colors: [
      token("--ui-color-primary-300"),
      token("--ui-color-primary-400"),
      token("--ui-color-primary-600"),
      token("--ui-color-neutral-200"),
      token("--ui-color-neutral-500"),
    ].filter(Boolean),
  });
  hideTimer = setTimeout(() => (showConfetti.value = false), 4000);
});

onBeforeUnmount(() => {
  cancel?.();
  clearTimeout(hideTimer);
});
</script>

<template>
  <div>
    <canvas
      v-if="showConfetti"
      ref="canvas"
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 z-50 size-full"
    />

    <div class="mx-auto flex max-w-xl flex-col items-center gap-8 text-center">
      <div class="w-full max-w-sm">
        <OnboardingArtDone />
      </div>

      <div class="flex flex-col items-center gap-3">
        <span
          class="flex size-11 items-center justify-center border border-primary/60 bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <UIcon name="lucide:check" class="size-5" />
        </span>
        <h1
          ref="heading"
          tabindex="-1"
          class="text-3xl font-semibold tracking-tight text-highlighted outline-none sm:text-4xl"
        >
          Ton compte est prêt
        </h1>
        <p class="max-w-md text-base leading-relaxed text-muted">
          Ton fil est réglé sur tes réponses. Tu pourras tout ajuster depuis tes préférences.
        </p>
      </div>

      <dl class="grid w-full gap-px bg-(--ui-border) p-px text-left sm:grid-cols-2">
        <div v-for="item in summary" :key="item.label" class="flex flex-col gap-1 bg-default p-4">
          <dt class="eyebrow">{{ item.label }}</dt>
          <dd class="text-sm text-highlighted">{{ item.value }}</dd>
        </div>
      </dl>

      <div class="flex w-full flex-col gap-3">
        <UButton
          to="/explore"
          size="xl"
          block
          label="Voir mon fil personnalisé"
          trailing-icon="lucide:arrow-right"
          :ui="{
            trailingIcon: 'transition-transform duration-150 group-hover:translate-x-0.5',
          }"
          class="group justify-center"
        />
        <UButton
          to="/preferences"
          color="neutral"
          variant="ghost"
          block
          label="Ajuster mes préférences"
        />
      </div>
    </div>
  </div>
</template>
