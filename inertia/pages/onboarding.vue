<script setup lang="ts">
import type { ContributionType, ExperienceLevel, UserPreferences } from "@shared/types/index";
import { Head, router } from "@inertiajs/vue3";
import OnboardingArtLanguages from "~/components/onboarding/OnboardingArtLanguages.vue";
import OnboardingArtLevel from "~/components/onboarding/OnboardingArtLevel.vue";
import OnboardingArtTopics from "~/components/onboarding/OnboardingArtTopics.vue";
import OnboardingArtTypes from "~/components/onboarding/OnboardingArtTypes.vue";

const props = defineProps<{
  initialStep: number;
  /** Deferred: inferred from the user's GitHub repositories, arrives after the first paint. */
  suggestedLanguages?: string[];
}>();

const authStore = useAuth();
const toast = useToast();
const { http } = useHttp();

const stored = authStore.user?.preferences ?? null;
const answers = reactive({
  // A new account answers the first question explicitly; nothing is pre-selected.
  level: (stored?.level ?? null) as ExperienceLevel | null,
  contributionTypes: [...(stored?.contributionTypes ?? [])] as ContributionType[],
  languages: [...(stored?.languages ?? [])],
  topics: [...(stored?.topics ?? [])],
});

const steps = [
  { field: "level", label: "Niveau" },
  { field: "contributionTypes", label: "Contributions" },
  { field: "languages", label: "Langages" },
  { field: "topics", label: "Centres d’intérêt" },
] as const;
const FINISH = steps.length + 1;

const step = ref(Math.min(Math.max(props.initialStep, 1), steps.length));
const reached = ref(Math.max(step.value - 1, authStore.user?.onboardingStep ?? 0));
const direction = ref<"forward" | "back">("forward");
const error = ref<string | null>(null);
const completing = ref(false);
const heading = useTemplateRef<HTMLElement>("heading");

const codes = computed(
  () => answers.contributionTypes.length === 0 || answers.contributionTypes.includes("code"),
);

const content = computed(() => {
  switch (step.value) {
    case 1:
      return {
        eyebrow: "Ton parcours",
        title: "Où en es-tu dans l’open source ?",
        description:
          "On adapte les projets proposés à ton expérience. Tu pourras changer d’avis à tout moment.",
        art: OnboardingArtLevel,
      };
    case 2:
      return {
        eyebrow: "Ta façon d’aider",
        title: "Comment aimes-tu contribuer ?",
        description:
          "Plusieurs choix possibles. Pas besoin de coder : la documentation, les traductions ou le triage comptent autant.",
        art: OnboardingArtTypes,
      };
    case 3:
      return {
        eyebrow: "Tes langages",
        title: "Avec quels langages es-tu à l’aise ?",
        description: codes.value
          ? "Ton fil répartit les projets entre eux. Sans sélection, tous les langages sont proposés."
          : "Facultatif si tu ne codes pas : sans sélection, tous les projets te sont proposés.",
        art: OnboardingArtLanguages,
      };
    default:
      return {
        eyebrow: "Tes centres d’intérêt",
        title: "Qu’est-ce qui t’attire ?",
        description:
          "Facultatif. Ces sujets GitHub apparaîtront en premier dans le catalogue pour filtrer en un clic.",
        art: OnboardingArtTopics,
      };
  }
});

const artProps = computed(() => {
  if (step.value === 1) return { level: answers.level };
  if (step.value === 2) return { selected: answers.contributionTypes };
  if (step.value === 3) return { selected: answers.languages };
  return { selected: answers.topics };
});

// Pre-select the user's GitHub languages until they make their own choice.
let languagesTouched = answers.languages.length > 0;
const suggested = computed(() => props.suggestedLanguages ?? []);
watch(
  suggested,
  (languages) => {
    if (!languagesTouched && languages.length) answers.languages = [...languages];
  },
  { immediate: true },
);

function toggle(field: "contributionTypes" | "languages" | "topics", value: string) {
  if (field === "languages") languagesTouched = true;
  const list = answers[field] as string[];
  (answers[field] as string[]) = list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
  error.value = null;
}

function validate(): string | null {
  if (step.value === 1 && !answers.level) return "Choisis l’option qui te correspond le mieux.";
  if (step.value === 2 && answers.contributionTypes.length === 0)
    return "Choisis au moins une façon de contribuer.";
  return null;
}

function goTo(target: number) {
  direction.value = target > step.value ? "forward" : "back";
  error.value = null;
  step.value = target;
}

/** Background save of a confirmed answer; navigation never waits for it. */
function saveProgress(current: number) {
  const field = steps[current - 1]!.field;
  http("/api/onboarding", {
    method: "PATCH",
    body: { step: current, [field]: answers[field] },
  }).catch(() =>
    toast.add({
      title: "Ta réponse n’a pas pu être enregistrée.",
      description: "Elle le sera à la fin du parcours.",
      icon: "lucide:cloud-off",
    }),
  );
}

function next() {
  error.value = validate();
  if (error.value) return;
  reached.value = Math.max(reached.value, step.value);

  if (step.value < steps.length) {
    saveProgress(step.value);
    goTo(step.value + 1);
    return;
  }

  completing.value = true;
  router.put("/onboarding", { ...answers } as UserPreferences, {
    preserveState: true,
    preserveScroll: true,
    onSuccess: () => goTo(FINISH),
    onError: () => {
      error.value = "Certaines réponses ne sont pas valides. Reviens sur les étapes précédentes.";
    },
    onFinish: () => {
      completing.value = false;
    },
  });
}

function back() {
  if (step.value > 1) goTo(step.value - 1);
}

function skip() {
  router.post("/onboarding/skip");
}

// Moving focus to the new question tells screen readers the step changed.
const focusHeading = () => heading.value?.focus();
</script>

<template>
  <Head title="Bienvenue" />

  <div class="flex min-h-dvh flex-col">
    <header class="border-b border-default">
      <div
        class="mx-auto flex h-(--ui-header-height) max-w-(--ui-container) items-center justify-between px-4 sm:border-x sm:border-default sm:px-8"
      >
        <ULink to="/" aria-label="Gitify, accueil" class="text-highlighted">
          <AppLogo class="h-6 w-auto" />
        </ULink>
        <UButton
          v-if="step !== FINISH"
          :label="authStore.user?.onboardedAt ? 'Fermer' : 'Plus tard'"
          color="neutral"
          variant="ghost"
          @click="authStore.user?.onboardedAt ? router.visit('/explore') : skip()"
        />
      </div>
    </header>

    <main class="flex flex-1 flex-col">
      <FrameSection v-if="step !== FINISH">
        <OnboardingStepper :steps="steps" :current="step" :reached="reached" @select="goTo" />
      </FrameSection>

      <FrameSection class="flex flex-1 flex-col" inner-class="flex flex-1 flex-col">
        <Transition :name="`step-${direction}`" mode="out-in" @after-enter="focusHeading">
          <div v-if="step === FINISH" key="finish" class="px-4 py-12 sm:px-8 sm:py-16">
            <OnboardingFinish :preferences="{ ...answers, level: answers.level! }" />
          </div>

          <div v-else :key="step" class="grid flex-1 lg:grid-cols-[1fr_24rem]">
            <div class="flex flex-col gap-8 px-4 py-10 sm:px-8 sm:py-14">
              <div class="flex flex-col gap-3">
                <p class="eyebrow">
                  <span class="size-1.5 bg-primary" aria-hidden="true" />
                  Étape {{ step }} sur {{ steps.length }} · {{ content.eyebrow }}
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
                v-if="step === 1"
                v-model="answers.level"
                :legend="content.title"
                @update:model-value="error = null"
              />
              <PreferenceTypesField
                v-else-if="step === 2"
                :legend="content.title"
                :selected="answers.contributionTypes"
                @toggle="toggle('contributionTypes', $event)"
              />
              <div v-else-if="step === 3" class="flex flex-col gap-3">
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
                  :selected="answers.languages"
                  :suggested="suggested"
                  @toggle="toggle('languages', $event)"
                />
              </div>
              <PreferenceTopicsField
                v-else
                :legend="content.title"
                :selected="answers.topics"
                @toggle="toggle('topics', $event)"
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
                <component :is="content.art" v-bind="artProps" />
              </div>
            </div>
          </div>
        </Transition>
      </FrameSection>

      <FrameSection
        v-if="step !== FINISH"
        class="sticky bottom-0 z-10 bg-default/90 backdrop-blur"
        inner-class="px-4 py-3 sm:px-8 sm:py-4"
      >
        <div class="flex items-center justify-between gap-3">
          <UButton
            v-if="step > 1"
            label="Retour"
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            @click="back"
          />
          <span v-else />
          <UButton
            :label="step === steps.length ? 'Terminer' : 'Continuer'"
            :trailing-icon="step === steps.length ? 'lucide:check' : 'lucide:arrow-right'"
            :loading="completing"
            size="lg"
            @click="next"
          />
        </div>
      </FrameSection>
    </main>
  </div>
</template>

<style scoped>
/* Short, direction-aware and interruptible: Vue cancels a running leave on a new step. */
.step-forward-enter-active,
.step-back-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.step-forward-leave-active,
.step-back-leave-active {
  transition:
    opacity 120ms ease-in,
    transform 120ms ease-in;
}

.step-forward-enter-from,
.step-back-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.step-forward-leave-to,
.step-back-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .step-forward-enter-from,
  .step-forward-leave-to,
  .step-back-enter-from,
  .step-back-leave-to {
    transform: none;
  }
}
</style>
