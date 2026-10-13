import { computed, ref } from "vue";
import type { PreferenceDraft, PreferenceDraftHandle } from "./usePreferenceDraft.js";
import {
  canRevisitOnboardingStep,
  clampOnboardingStep,
  lastOnboardingStep,
  nextOnboardingStep,
  onboardingFieldAt,
  onboardingFinishStep,
  previousOnboardingStep,
  type OnboardingField,
} from "../../shared/onboarding.js";

export interface OnboardingFlowOptions {
  initialStep: number;
  answeredSteps: number | null;
  preferences: Pick<PreferenceDraftHandle, "draft" | "submit" | "saveAnswer">;
  onAnswerNotSaved(): void;
}

interface RequiredAnswer {
  isMissing(draft: PreferenceDraft): boolean;
  message: string;
}

const requiredAnswers: Partial<Record<OnboardingField, RequiredAnswer>> = {
  level: {
    isMissing: (draft) => !draft.level,
    message: "Choisis l’option qui te correspond le mieux.",
  },
  contributionTypes: {
    isMissing: (draft) => draft.contributionTypes.length === 0,
    message: "Choisis au moins une façon de contribuer.",
  },
};

const invalidAnswers =
  "Certaines réponses ne sont pas valides. Reviens sur les étapes précédentes.";

export function useOnboardingFlow({
  initialStep,
  answeredSteps,
  preferences,
  onAnswerNotSaved,
}: OnboardingFlowOptions) {
  const step = ref(clampOnboardingStep(initialStep));
  const reached = ref(Math.max(step.value - 1, answeredSteps ?? 0));
  const direction = ref<"forward" | "back">("forward");
  const error = ref<string | null>(null);
  const finished = computed(() => step.value === onboardingFinishStep);
  const isLastQuestion = computed(() => step.value === lastOnboardingStep);

  function missingAnswer(): string | null {
    const required = requiredAnswers[onboardingFieldAt(step.value)];
    return required?.isMissing(preferences.draft) ? required.message : null;
  }

  function goTo(target: number) {
    direction.value = target > step.value ? "forward" : "back";
    error.value = null;
    step.value = target;
  }

  function select(target: number) {
    if (canRevisitOnboardingStep(target, reached.value)) goTo(target);
  }

  function next() {
    error.value = missingAnswer();
    if (error.value) return;
    reached.value = Math.max(reached.value, step.value);

    if (!isLastQuestion.value) {
      preferences.saveAnswer(step.value).catch(onAnswerNotSaved);
      goTo(nextOnboardingStep(step.value));
      return;
    }

    preferences.submit("/onboarding", {
      preserveState: true,
      onSuccess: () => goTo(onboardingFinishStep),
      onError: () => {
        error.value = invalidAnswers;
      },
    });
  }

  function back() {
    goTo(previousOnboardingStep(step.value));
  }

  function clearError() {
    error.value = null;
  }

  return {
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
  };
}
