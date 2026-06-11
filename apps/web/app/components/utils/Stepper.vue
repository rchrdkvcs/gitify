<script setup lang="ts">
import { ref } from "vue";
import type { PreferenceGroup } from "~/types/preferences";

const props = defineProps({
  difficulty: String,
  languages: Array as PropType<string[]>,
  steps: {
    type: Array as PropType<PreferenceGroup[]>,
    required: true,
  },
  validateStep: {
    type: Function,
    default: () => true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "submit"): void;
}>();

const currentStep = ref(1);
const progressValue = computed(() => (currentStep.value * 100) / props.steps.length);
const currentStepData = computed(() => props.steps[currentStep.value - 1]);
const isLastStep = computed(() => currentStep.value === props.steps.length);

const nextStep = () => {
  if (currentStep.value < props.steps.length) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleNext = async () => {
  if (!isLastStep.value) {
    nextStep();
    return;
  }

  emit("submit");
};
</script>

<template>
  <div class="mt-5 md:mt-10">
    <main>
      <section class="flex flex-col gap-2">
        <div class="flex justify-between">
          <p class="uppercase">étape {{ currentStep }}/{{ props.steps.length }}</p>
          <p>{{ currentStepData?.label }}</p>
        </div>
        <UProgress v-model="progressValue" class="h-1" />
      </section>

      <UPageHero :description="currentStepData?.description">
        <template #title>
          <h1 class="title">
            {{ currentStepData?.title }}
          </h1>
        </template>
      </UPageHero>

      <slot :name="`step-${currentStep}`"></slot>
    </main>

    <footer
      class="mt-8 flex justify-between md:mt-16"
      :class="currentStep <= 1 ? 'justify-end' : ''"
    >
      <UButton
        v-if="currentStep > 1"
        label="Retour"
        color="secondary"
        icon="lucide:arrow-left"
        class="w-fit"
        block
        @click="prevStep"
        :disabled="currentStep === 1"
      />
      <UButton
        :label="isLastStep ? 'Confirmer' : 'Suivant'"
        color="brand"
        :trailing-icon="
          !loading ? (isLastStep ? 'lucide:rocket' : 'lucide:arrow-right') : undefined
        "
        class="w-fit"
        block
        @click="handleNext"
        :loading="loading"
        :disabled="loading || !validateStep(currentStep)"
      />
    </footer>
  </div>
</template>
