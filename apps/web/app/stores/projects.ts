import { defineStore } from 'pinia'
import type { ProjectGroup } from "~/types/projects"

export const useProjectsStore = defineStore("projects", () => {
    const config = useRuntimeConfig();

    const showcaseData = ref<ProjectGroup[]>([]);

    const fetchVitrine = async () => {
        try {
            const response = await $fetch<{ languages: ProjectGroup[] }>(config.public.apiBaseUrl + "/projects/showcase", {
                method: "GET"
            });

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

    return {
        showcaseData,
        fetchVitrine,
    };
});