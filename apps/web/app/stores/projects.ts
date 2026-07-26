import { defineStore } from "pinia";
import type { ProjectGroup } from "~/types/projects";

export const useProjectsStore = defineStore("projects", () => {
  const config = useRuntimeConfig();

  const showcaseData = ref<ProjectGroup[]>([]);
  const feedData = ref<Project[]>([]);

  const fetchVitrine = async () => {
    try {
      const response = await $fetch<{ languages: ProjectGroup[] }>(
        config.public.apiBaseUrl + "/projects/showcase",
        {
          method: "GET",
        },
      );

      if (response && Array.isArray(response.languages)) {
        showcaseData.value = response.languages;
        return response.languages;
      }

      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération de la vitrine:", error);
      return [];
    }
  };

  const fetchFeed = async (): Promise<Project[]> => {
    try {
      const headers = useRequestHeaders(["cookie"]);

      const response = await $fetch<{ projects: Project[] }>(
        config.public.apiBaseUrl + "/projects/feed",
        {
          method: "GET",
          credentials: "include",
          headers,
        },
      );

      if (response && Array.isArray(response.projects)) {
        feedData.value = response.projects;
        return response.projects;
      }

      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération du feed:", error);
      return [];
    }
  };

  return {
    showcaseData,
    feedData,
    fetchVitrine,
    fetchFeed,
  };
});
