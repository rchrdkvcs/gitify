import { router } from "@inertiajs/vue3";

export function usePreferences() {
  const authStore = useAuth();
  const user = computed(() => authStore.user);
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
          root: "bg-canvas border border-border",
        },
      });
      return;
    }

    submitting.value = true;
    router.put(
      "/auth/preferences",
      {
        difficulty: formDifficulty.value,
        languages: formLanguages.value,
      },
      {
        onSuccess: () => {
          isEditingPreferences.value = false;
          toast.add({ title: "Vos préférences ont été mises à jour.", color: "success" });
        },
        onError: () =>
          toast.add({ title: "Impossible de sauvegarder vos préférences.", color: "error" }),
        onFinish: () => {
          submitting.value = false;
        },
      },
    );
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
