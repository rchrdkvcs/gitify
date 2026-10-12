<script setup lang="ts">
import { Head } from "@inertiajs/vue3";
import { stepperItems } from "~/utils/constants";

const {
  user,
  formDifficulty,
  formLanguages,
  toggleLanguage,
  editPreferences,
  savePreferences,
  submitting,
} = usePreferences();

const hasPreferences = computed(() => !!user.value?.preferences);

const validateStep = (step: number) => {
  if (step === 1 && !formDifficulty.value) return "Choisis un niveau pour continuer.";
  if (step === 2 && formLanguages.value.length === 0)
    return "Choisis au moins un langage pour continuer.";
  return null;
};

onMounted(() => {
  if (user.value?.preferences) {
    editPreferences();
  }
});
</script>

<template>
  <Head title="Préférences" />

  <div class="flex min-h-dvh flex-col">
    <header class="border-b border-default">
      <div
        class="mx-auto flex h-(--ui-header-height) max-w-(--ui-container) items-center justify-between px-4 sm:border-x sm:border-default sm:px-8"
      >
        <ULink to="/" aria-label="Gitify, accueil" class="text-highlighted">
          <AppLogo class="h-6 w-auto" />
        </ULink>
        <UButton
          v-if="hasPreferences"
          to="/profil"
          label="Annuler"
          color="neutral"
          variant="ghost"
        />
      </div>
    </header>

    <main class="flex flex-1 flex-col">
      <Stepper
        :steps="stepperItems"
        :validate-step="validateStep"
        :loading="submitting"
        @submit="savePreferences"
      >
        <template #step-1>
          <LevelSelection v-model="formDifficulty" :items="stepperItems[0]?.data ?? []" />
        </template>

        <template #step-2>
          <LangSelection
            :languages="formLanguages"
            :items="stepperItems[1]?.data ?? []"
            @toggle="toggleLanguage"
          />
        </template>

        <template #step-3>
          <Summary :level="formDifficulty ?? undefined" :languages="formLanguages" :user="user" />
        </template>
      </Stepper>
      <div class="mx-auto w-full max-w-(--ui-container) flex-1 sm:border-x sm:border-default" />
    </main>
  </div>
</template>
