import type { ProjectDetail } from "@gitify/types";

export function useProjectDetail(id: string) {
  const { http } = useHttp();

  const project = ref<ProjectDetail | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchProject() {
    loading.value = true;
    error.value = null;
    try {
      const data = await http<{ project: ProjectDetail }>(`/projects/${id}`);
      project.value = data.project;
    } catch {
      error.value = "Impossible de charger ce projet.";
    } finally {
      loading.value = false;
    }
  }

  return {
    project,
    loading,
    error,
    fetchProject,
  };
}
