<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

const authStore = useAuth();
const toast = useToast();
const {
  draft: form,
  toggle,
  submitting,
  submit,
} = usePreferenceDraft({ stored: authStore.user?.preferences ?? null });

function savePreferences() {
  submit("/auth/preferences", {
    onSuccess: () =>
      toast.add({ title: "Préférences enregistrées.", icon: "lucide:check", color: "success" }),
    onError: () =>
      toast.add({
        title: "Impossible d’enregistrer tes préférences.",
        description: "Vérifie tes choix et réessaie.",
        color: "error",
      }),
  });
}

const sections = [
  {
    id: "level",
    title: "Niveau",
    description: "Ton expérience de l’open source décide du type de projets proposés.",
  },
  {
    id: "types",
    title: "Façons de contribuer",
    description: "Aucune sélection : toutes les contributions sont proposées.",
  },
  {
    id: "languages",
    title: "Langages",
    description: "Ton fil répartit les projets entre eux. Aucune sélection : tous les langages.",
  },
  {
    id: "topics",
    title: "Centres d’intérêt",
    description: "Ces sujets apparaissent en premier dans les filtres du catalogue.",
  },
] as const;
</script>

<template>
  <Head title="Préférences" />

  <PageHeader
    eyebrow="Préférences"
    title="Ce que tu cherches"
    description="Ces réponses règlent les filtres par défaut de ton catalogue. Modifie-les quand tu veux."
  >
    <template #actions>
      <UButton
        to="/onboarding"
        icon="lucide:route"
        label="Refaire le parcours guidé"
        color="neutral"
        variant="outline"
      />
    </template>
  </PageHeader>

  <FrameSection v-for="section in sections" :key="section.id">
    <div class="grid lg:grid-cols-[16rem_1fr]">
      <div class="border-b border-default p-5 sm:p-8 lg:border-e lg:border-b-0">
        <h2 :id="`${section.id}-title`" class="font-medium text-highlighted">
          {{ section.title }}
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-muted">{{ section.description }}</p>
      </div>
      <div class="p-5 sm:p-8">
        <PreferenceLevelField
          v-if="section.id === 'level'"
          v-model="form.level"
          :legend="section.title"
        />
        <PreferenceTypesField
          v-else-if="section.id === 'types'"
          :legend="section.title"
          :selected="form.contributionTypes"
          @toggle="toggle('contributionTypes', $event)"
        />
        <PreferenceLanguagesField
          v-else-if="section.id === 'languages'"
          :legend="section.title"
          :selected="form.languages"
          @toggle="toggle('languages', $event)"
        />
        <PreferenceTopicsField
          v-else
          :legend="section.title"
          :selected="form.topics"
          @toggle="toggle('topics', $event)"
        />
      </div>
    </div>
  </FrameSection>

  <FrameSection
    class="sticky bottom-0 z-10 bg-default/90 backdrop-blur"
    inner-class="px-4 py-3 sm:px-8 sm:py-4"
  >
    <div class="flex items-center justify-end gap-3">
      <UButton to="/profil" label="Annuler" color="neutral" variant="ghost" />
      <UButton
        label="Enregistrer"
        trailing-icon="lucide:check"
        size="lg"
        :loading="submitting"
        @click="savePreferences"
      />
    </div>
  </FrameSection>
</template>
