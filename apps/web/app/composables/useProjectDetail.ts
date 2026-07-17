import type { ProjectDetail } from "@gitify/types";

export function useProjectDetail(id: string) {
  const config = useRuntimeConfig();
  const project = ref<ProjectDetail | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchProject() {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch<{ project: ProjectDetail }>("/projects/" + id, {
        baseURL: config.public.apiBaseUrl,
        method: "GET",
        credentials: "include",
      });
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
