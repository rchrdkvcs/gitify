import type { UserPreferences } from "@shared/types/index";
import { router } from "@inertiajs/vue3";
import { defaultUserPreferences } from "@shared/preferences";

type ListField = "languages" | "contributionTypes" | "topics";

/** Editable copy of the user's preferences, shared by the onboarding and the preferences page. */
export function usePreferences() {
  const authStore = useAuth();
  const toast = useToast();
  const stored = authStore.user?.preferences ?? defaultUserPreferences;

  const form = reactive<UserPreferences>({
    level: stored.level,
    languages: [...stored.languages],
    contributionTypes: [...stored.contributionTypes],
    topics: [...stored.topics],
  });
  const submitting = ref(false);

  function toggle<K extends ListField>(field: K, value: UserPreferences[K][number]) {
    const list = form[field] as string[];
    form[field] = (
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    ) as UserPreferences[K];
  }

  function savePreferences() {
    submitting.value = true;
    router.put("/auth/preferences", form, {
      onSuccess: () => {
        toast.add({ title: "Préférences enregistrées.", icon: "lucide:check", color: "success" });
      },
      onError: () =>
        toast.add({
          title: "Impossible d’enregistrer tes préférences.",
          description: "Vérifie tes choix et réessaie.",
          color: "error",
        }),
      onFinish: () => {
        submitting.value = false;
      },
    });
  }

  return { form, toggle, submitting, savePreferences };
}
