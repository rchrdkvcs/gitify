import type { Data } from "@gitify/api/data";

export function usePreferences() {
  const authStore = useAuthStore();
  const user = computed(() => authStore.user);
  const config = useRuntimeConfig();
  const toast = useToast();

  const submitting = ref(false);
  const isEditingPreferences = ref(false);
  const formDifficulty = ref<"beginner" | "expert" | null>(null);
  const formLanguages = ref<string[]>([]);

  function toggleLanguage(lang: string) {
    if (formLanguages.value.includes(lang)) {
      formLanguages.value = formLanguages.value.filter((l) => l !== lang);
    } else {
      formLanguages.value.push(lang);
    }
  }

  function editPreferences() {
    if (user.value?.preferences) {
      formDifficulty.value = user.value.preferences.difficulty;
      formLanguages.value = [...user.value.preferences.languages];
    } else {
      formDifficulty.value = "beginner";
    }
    isEditingPreferences.value = true;
  }

  async function savePreferences() {
    if (formLanguages.value.length === 0) {
      toast.add({
        title: "Veuillez sélectionner au moins un langage.",
        icon: "i-heroicons-exclamation-circle-20-solid",
        ui: {
          root: "bg-dark border border-light/5",
        },
      });
      return;
    }

    submitting.value = true;
    try {
      const response = await $fetch<{ user: Data.User }>("/auth/preferences", {
        baseURL: config.public.apiBaseUrl,
        method: "PUT",
        credentials: "include",
        body: {
          difficulty: formDifficulty.value,
          languages: formLanguages.value,
        },
      });
      authStore.user = response.user;
      isEditingPreferences.value = false;
      await navigateTo("/");
      toast.add({
        title: "Vos préférences ont été mises à jour.",
        icon: "i-heroicons-check-circle-20-solid",
        color: "success",
        ui: {
          root: "bg-dark border border-light/5",
        },
      });
    } catch (e) {
      console.error("Failed to save preferences:", e);
      toast.add({
        title: "Oups, une erreur s'est produite.",
        description: "Impossible de joindre le serveur. Merci de réessayer.",
        icon: "i-heroicons-exclamation-circle-20-solid",
        ui: {
          root: "bg-dark border border-light/5",
        },
      });
    } finally {
      submitting.value = false;
    }
  }

  return {
    user,
    submitting,
    isEditingPreferences,
    formDifficulty,
    formLanguages,
    toggleLanguage,
    editPreferences,
    savePreferences,
  };
}
