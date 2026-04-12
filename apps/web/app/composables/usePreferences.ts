import type { User } from "./useAuth";

export function usePreferences(user: Ref<User | null>) {
  const { http } = useHttp();
  const submitting = ref(false);
  const isEditingPreferences = ref(false);
  const formDifficulty = ref<"beginner" | "expert">("beginner");
  const formLanguages = ref<string[]>([]);

  const availableLanguages = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "ruby",
    "go",
    "rust",
    "php",
    "swift",
  ];

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
    }
    isEditingPreferences.value = true;
  }

  async function savePreferences() {
    if (formLanguages.value.length === 0) {
      alert("Veuillez sélectionner au moins un langage.");
      return;
    }

    submitting.value = true;
    try {
      const response = await http<{ user: User }>("/auth/preferences", {
        method: "PUT",
        body: {
          difficulty: formDifficulty.value,
          languages: formLanguages.value,
        },
      });
      user.value = response.user;
      isEditingPreferences.value = false;
    } catch (e) {
      console.error("Failed to save preferences:", e);
    } finally {
      submitting.value = false;
    }
  }

  return {
    submitting,
    isEditingPreferences,
    formDifficulty,
    formLanguages,
    availableLanguages,
    toggleLanguage,
    editPreferences,
    savePreferences,
  };
}
