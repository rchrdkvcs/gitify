export interface Project {
  id: number;
  name: string;
  ownerName: string;
  description: string | null;
  repositoryUrl: string;
  stars: number;
  language: string | null;
  topics: string[] | null;
  openIssuesCount: number;
  difficulty: "beginner" | "expert";
}

export function useSwipe() {
  const { http } = useHttp();
  const projects = ref<Project[]>([]);
  const currentIndex = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const actionLoading = ref(false);

  const currentProject = computed(() => projects.value[currentIndex.value] ?? null);
  const remaining = computed(() => projects.value.length - currentIndex.value);

  async function fetchFeed() {
    loading.value = true;
    error.value = null;
    try {
      const data = await http<{ projects: Project[] }>("/projects/feed");
      projects.value = [...projects.value, ...data.projects];
    } catch {
      error.value = "Impossible de charger les projets.";
    } finally {
      loading.value = false;
    }
  }

  async function swipe(type: "like" | "pass") {
    if (!currentProject.value || actionLoading.value) return;
    actionLoading.value = true;
    try {
      await http(`/projects/${currentProject.value.id}/${type}`, {
        method: "POST",
      });
      currentIndex.value++;
      if (remaining.value < 5) await fetchFeed();
    } catch {
      error.value = "Une erreur est survenue.";
    } finally {
      actionLoading.value = false;
    }
  }

  return { projects, currentProject, remaining, loading, error, actionLoading, fetchFeed, swipe };
}
