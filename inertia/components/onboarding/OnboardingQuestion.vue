<script setup lang="ts">
import type { ExperienceLevel } from "@shared/types/index";
import { lastOnboardingStep, onboardingFieldAt } from "@shared/onboarding";
import type { PreferenceDraft, PreferenceListField } from "~/composables/usePreferenceDraft";
import OnboardingArtLanguages from "~/components/onboarding/OnboardingArtLanguages.vue";
import OnboardingArtLevel from "~/components/onboarding/OnboardingArtLevel.vue";
import OnboardingArtTopics from "~/components/onboarding/OnboardingArtTopics.vue";
import OnboardingArtTypes from "~/components/onboarding/OnboardingArtTypes.vue";

const props = defineProps<{
  step: number;
  draft: PreferenceDraft;
  suggested: string[];
  error: string | null;
}>();

const emit = defineEmits<{
  level: [level: ExperienceLevel | null];
  toggle: [field: PreferenceListField, value: string];
}>();

const heading = useTemplateRef<HTMLElement>("heading");
defineExpose({ focus: () => heading.value?.focus() });

const field = computed(() => onboardingFieldAt(props.step));

const codes = computed(
  () =>
    props.draft.contributionTypes.length === 0 || props.draft.contributionTypes.includes("code"),
);

const content = computed(() => {
  switch (field.value) {
    case "level":
      return {
        eyebrow: "Ton parcours",
        title: "Où en es-tu dans l’open source ?",
        description:
          "On adapte les projets proposés à ton expérience. Tu pourras changer d’avis à tout moment.",
        art: OnboardingArtLevel,
        artProps: { level: props.draft.level },
      };
    case "contributionTypes":
      return {
        eyebrow: "Ta façon d’aider",
        title: "Comment aimes-tu contribuer ?",
        description:
          "Plusieurs choix possibles. Pas besoin de coder : la documentation, les traductions ou le triage comptent autant.",
        art: OnboardingArtTypes,
        artProps: { selected: props.draft.contributionTypes },
      };
    case "languages":
      return {
        eyebrow: "Tes langages",
        title: "Avec quels langages es-tu à l’aise ?",
        description: codes.value
          ? "Ton fil répartit les projets entre eux. Sans sélection, tous les langages sont proposés."
          : "Facultatif si tu ne codes pas : sans sélection, tous les projets te sont proposés.",
        art: OnboardingArtLanguages,
        artProps: { selected: props.draft.languages },
      };
    default:
      return {
        eyebrow: "Tes centres d’intérêt",
        title: "Qu’est-ce qui t’attire ?",
        description:
          "Facultatif. Ces sujets GitHub apparaîtront en premier dans le catalogue pour filtrer en un clic.",
        art: OnboardingArtTopics,
        artProps: { selected: props.draft.topics },
      };
  }
});
</script>

<template>
  <div class="grid flex-1 lg:grid-cols-[1fr_24rem]">
    <div class="flex flex-col gap-8 px-4 py-10 sm:px-8 sm:py-14">
      <div class="flex flex-col gap-3">
        <p class="eyebrow">
          <span class="size-1.5 bg-primary" aria-hidden="true" />
          Étape {{ step }} sur {{ lastOnboardingStep }} · {{ content.eyebrow }}
        </p>
        <h1
          ref="heading"
          tabindex="-1"
          class="text-3xl font-semibold tracking-tight text-highlighted outline-none sm:text-4xl"
        >
          {{ content.title }}
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-muted">
          {{ content.description }}
        </p>
      </div>

      <PreferenceLevelField
        v-if="field === 'level'"
        :model-value="draft.level"
        :legend="content.title"
        @update:model-value="emit('level', $event)"
      />
      <PreferenceTypesField
        v-else-if="field === 'contributionTypes'"
        :legend="content.title"
        :selected="draft.contributionTypes"
        @toggle="emit('toggle', 'contributionTypes', $event)"
      />
      <div v-else-if="field === 'languages'" class="flex flex-col gap-3">
        <p
          v-if="suggested.length"
          class="inline-flex items-center gap-2 text-sm text-muted"
          role="status"
        >
          <UIcon name="lucide:github" class="size-4 shrink-0" aria-hidden="true" />
          Suggestions tirées de tes dépôts GitHub.
        </p>
        <PreferenceLanguagesField
          :legend="content.title"
          :selected="draft.languages"
          :suggested="suggested"
          @toggle="emit('toggle', 'languages', $event)"
        />
      </div>
      <PreferenceTopicsField
        v-else
        :legend="content.title"
        :selected="draft.topics"
        @toggle="emit('toggle', 'topics', $event)"
      />

      <p class="min-h-5 text-sm text-error" role="status" aria-live="polite">
        <span v-if="error" class="inline-flex items-center gap-1.5">
          <UIcon name="lucide:circle-alert" class="size-4" aria-hidden="true" />
          {{ error }}
        </span>
      </p>
    </div>

    <div
      class="bg-grid order-first flex items-center justify-center border-b border-default bg-muted/40 px-8 py-6 lg:order-none lg:border-s lg:border-b-0 lg:py-10"
    >
      <div class="w-full max-w-60 lg:max-w-none">
        <component :is="content.art" v-bind="content.artProps" />
      </div>
    </div>
  </div>
</template>
