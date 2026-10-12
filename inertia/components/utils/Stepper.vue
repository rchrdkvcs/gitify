<script setup lang="ts">
import type { PreferenceGroup } from "~/types/preferences";

const props = defineProps<{
  steps: PreferenceGroup[];
  validateStep: (step: number) => string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "submit"): void;
}>();

const currentStep = ref(1);
const error = ref<string | null>(null);
const headingRef = ref<HTMLElement | null>(null);

const currentStepData = computed(() => props.steps[currentStep.value - 1]);
const isLastStep = computed(() => currentStep.value === props.steps.length);

const goTo = async (step: number) => {
  currentStep.value = step;
  error.value = null;
  await nextTick();
  headingRef.value?.focus();
};

const handleNext = () => {
  error.value = props.validateStep(currentStep.value);
  if (error.value) return;

  if (isLastStep.value) {
    emit("submit");
    return;
  }
  goTo(currentStep.value + 1);
};

const handleBack = () => {
  if (currentStep.value > 1) goTo(currentStep.value - 1);
};
</script>

<template>
  <div class="flex flex-col">
    <FrameSection inner-class="px-4 sm:px-8">
      <ol class="flex gap-px py-5" aria-label="Étapes">
        <li
          v-for="(step, index) in steps"
          :key="step.label"
          class="flex flex-1 flex-col gap-2"
          :aria-current="index + 1 === currentStep ? 'step' : undefined"
        >
          <span
            class="h-0.5 transition-colors duration-150"
            :class="index + 1 <= currentStep ? 'bg-primary' : 'bg-accented'"
            aria-hidden="true"
          />
          <span
            class="font-mono text-xs"
            :class="index + 1 === currentStep ? 'text-highlighted' : 'text-muted'"
          >
            <span class="tabular-nums">0{{ index + 1 }}</span>
            <span class="max-sm:sr-only"> · {{ step.label }}</span>
          </span>
        </li>
      </ol>
    </FrameSection>

    <FrameSection inner-class="px-4 py-12 sm:px-8 sm:py-16">
      <div class="mx-auto flex max-w-3xl flex-col gap-10">
        <div class="flex flex-col gap-3">
          <p class="eyebrow">Étape {{ currentStep }} sur {{ steps.length }}</p>
          <h1
            ref="headingRef"
            tabindex="-1"
            class="text-3xl font-semibold tracking-tight text-highlighted outline-none sm:text-4xl"
          >
            {{ currentStepData?.title }}
          </h1>
          <p class="max-w-xl text-base leading-relaxed text-muted">
            {{ currentStepData?.description }}
          </p>
        </div>

        <slot :name="`step-${currentStep}`" />

        <p class="min-h-5 text-sm text-error" role="status" aria-live="polite">
          <span v-if="error" class="inline-flex items-center gap-1.5">
            <UIcon name="lucide:circle-alert" class="size-4" aria-hidden="true" />
            {{ error }}
          </span>
        </p>
      </div>
    </FrameSection>

    <FrameSection inner-class="px-4 py-4 sm:px-8">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <UButton
          v-if="currentStep > 1"
          label="Retour"
          icon="lucide:arrow-left"
          color="neutral"
          variant="ghost"
          @click="handleBack"
        />
        <span v-else />
        <UButton
          :label="isLastStep ? 'Enregistrer mes préférences' : 'Continuer'"
          :trailing-icon="isLastStep ? 'lucide:check' : 'lucide:arrow-right'"
          :loading="loading"
          size="lg"
          @click="handleNext"
        />
      </div>
    </FrameSection>
  </div>
</template>
