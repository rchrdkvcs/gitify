<script setup lang="ts">
import type { ExperienceLevel } from "@shared/types/index";
import { Head, router } from "@inertiajs/vue3";
import { onboardingSteps } from "@shared/onboarding";
import type { PreferenceListField } from "~/composables/usePreferenceDraft";

const props = defineProps<{
  initialStep: number;
  suggestedLanguages?: string[];
}>();

const authStore = useAuth();
const toast = useToast();

const preferences = usePreferenceDraft({
  stored: authStore.user?.preferences ?? null,
  unsetLevel: true,
});
const { draft, submitting, toggle, prefill } = preferences;

const {
  step,
  reached,
  direction,
  error,
  finished,
  isLastQuestion,
  next,
  back,
  select,
  clearError,
} = useOnboardingFlow({
  initialStep: props.initialStep,
  answeredSteps: authStore.user?.onboardingStep ?? null,
  preferences,
  onAnswerNotSaved: () =>
    toast.add({
      title: "Ta réponse n’a pas pu être enregistrée.",
      description: "Elle le sera à la fin du parcours.",
      icon: "lucide:cloud-off",
    }),
});

const suggested = computed(() => props.suggestedLanguages ?? []);
watch(suggested, (languages) => prefill("languages", languages), { immediate: true });

const question = useTemplateRef<{ focus(): void }>("question");
const finishedPreferences = computed(() => ({ ...draft, level: draft.level! }));

function answerLevel(level: ExperienceLevel | null) {
  draft.level = level;
  clearError();
}

function answerList(field: PreferenceListField, value: string) {
  toggle(field, value);
  clearError();
}

function leave() {
  if (authStore.user?.onboardedAt) router.visit("/explore");
  else router.post("/onboarding/skip");
}
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
          v-if="!finished"
          :label="authStore.user?.onboardedAt ? 'Fermer' : 'Plus tard'"
          color="neutral"
          variant="ghost"
          @click="leave"
        />
      </div>
    </header>

    <main class="flex flex-1 flex-col">
      <FrameSection v-if="!finished">
        <OnboardingStepper
          :steps="onboardingSteps"
          :current="step"
          :reached="reached"
          @select="select"
        />
      </FrameSection>

      <FrameSection class="flex flex-1 flex-col" inner-class="flex flex-1 flex-col">
        <Transition :name="`step-${direction}`" mode="out-in" @after-enter="question?.focus()">
          <div v-if="finished" key="finish" class="px-4 py-12 sm:px-8 sm:py-16">
            <OnboardingFinish :preferences="finishedPreferences" />
          </div>
          <OnboardingQuestion
            v-else
            ref="question"
            :key="step"
            :step="step"
            :draft="draft"
            :suggested="suggested"
            :error="error"
            @level="answerLevel"
            @toggle="answerList"
          />
        </Transition>
      </FrameSection>

      <FrameSection
        v-if="!finished"
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
            :label="isLastQuestion ? 'Terminer' : 'Continuer'"
            :trailing-icon="isLastQuestion ? 'lucide:check' : 'lucide:arrow-right'"
            :loading="submitting"
            size="lg"
            @click="next"
          />
        </div>
      </FrameSection>
    </main>
  </div>
</template>

<style scoped>
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
