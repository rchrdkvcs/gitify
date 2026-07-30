interface FavoritableProject {
  id: string;
  isFavorite: boolean;
}

export function useFavorite(
  project: () => FavoritableProject,
  onChange?: (isFavorite: boolean) => void,
) {
  const { http } = useHttp();
  const toast = useToast();
  const isFavorite = ref(project().isFavorite);
  const pending = ref(false);

  watch(
    () => project().isFavorite,
    (value) => {
      isFavorite.value = value;
    },
  );

  async function toggleFavorite() {
    if (pending.value) {
      return;
    }

    const previousValue = isFavorite.value;
    const nextValue = !previousValue;
    isFavorite.value = nextValue;
    pending.value = true;

    try {
      await http(`/projects/${project().id}/favorite`, {
        method: nextValue ? "POST" : "DELETE",
      });
      onChange?.(nextValue);
    } catch {
      isFavorite.value = previousValue;
      toast.add({
        title: "Impossible de modifier ce favori",
        description: "Veuillez réessayer dans quelques instants.",
        icon: "lucide:triangle-alert",
        color: "error",
      });
    } finally {
      pending.value = false;
    }
  }

  return {
    isFavorite,
    pending,
    toggleFavorite,
  };
}
