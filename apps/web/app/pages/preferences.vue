<script setup lang="ts">
import { stepperItems } from "~/utils/constants";

definePageMeta({
  layout: false,
  middleware: "auth",
});

const { user, formDifficulty, formLanguages, toggleLanguage, savePreferences, submitting } =
  usePreferences();

const checkStepValidation = (currentStep: number) => {
  if (currentStep === 1) return !!formDifficulty.value;
  if (currentStep === 2) return formLanguages.value.length > 0;
  return true;
};

const handleFinalSubmit = async () => {
  await savePreferences();
  await navigateTo("/");
};
</script>

<template>
  <div class="m-5 md:mx-20 md:my-10">
    <header>
      <div class="w-fit">
        <ULink to="/">
          <AppLogo />
        </ULink>
      </div>
    </header>

    <Stepper
      :steps="stepperItems"
      :validate-step="checkStepValidation"
      :difficulty="formDifficulty"
      :languages="formLanguages"
      :loading="submitting"
      @submit="handleFinalSubmit"
    >
      <template #step-1>
        <LevelSelection v-model="formDifficulty" :items="stepperItems[0]?.data" />
      </template>

      <template #step-2>
        <LangSelection
          :languages="formLanguages"
          :items="stepperItems[1]?.data"
          @toggle="toggleLanguage"
        />
      </template>

      <template #step-3>
        <Summary :level="formDifficulty" :languages="formLanguages" :user="user" />
      </template>
    </Stepper>
  </div>
</template>
