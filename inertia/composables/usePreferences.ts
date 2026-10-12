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
        title: "Choisis au moins un langage pour continuer.",
        icon: "lucide:circle-alert",
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
          toast.add({ title: "Préférences enregistrées.", icon: "lucide:check", color: "success" });
        },
        onError: () =>
          toast.add({
            title: "Impossible d’enregistrer tes préférences.",
            description: "Vérifie ta connexion et réessaie.",
            color: "error",
          }),
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
