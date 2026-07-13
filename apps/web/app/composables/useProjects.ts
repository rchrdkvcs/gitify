import type { Project } from "@gitify/types";
import { useProjectsStore } from "~/stores/projects";

const BATCH_COUNT = 4;

export type StarSort = "default" | "most-starred" | "least-starred";

export function useProjects() {
  const projectsStore = useProjectsStore();

  const pool = ref<Project[]>([]);
  const isLoading = ref(true);
  const visibleCount = ref(BATCH_COUNT);
  const languageFilter = ref<string[]>([]);
  const searchQuery = ref("");
  const starSort = ref<StarSort>("default");

  const filteredPool = computed(() => {
    let result = pool.value;

    if (languageFilter.value.length > 0) {
      result = result.filter(
        (project) => project.language !== null && languageFilter.value.includes(project.language),
      );
    }

    const query = searchQuery.value.trim().toLowerCase();
    if (query.length > 0) {
      result = result.filter((project) => project.name.toLowerCase().includes(query));
    }

    if (starSort.value === "most-starred") {
      result = [...result].sort((a, b) => b.stars - a.stars);
    } else if (starSort.value === "least-starred") {
      result = [...result].sort((a, b) => a.stars - b.stars);
    }

    return result;
  });

  const projects = computed(() => filteredPool.value.slice(0, visibleCount.value));

  const hasMore = computed(() => visibleCount.value < filteredPool.value.length);

  async function fetchFeed() {
    return await projectsStore.fetchFeed();
  }

  async function getFourProjects() {
    isLoading.value = true;
    try {
      pool.value = await fetchFeed();
      visibleCount.value = BATCH_COUNT;
      return projects.value;
    } finally {
      isLoading.value = false;
    }
  }

  function loadMore(count = BATCH_COUNT) {
    visibleCount.value += count;
  }

  watch([languageFilter, searchQuery, starSort], () => {
    visibleCount.value = BATCH_COUNT;
  });

  return {
    projects,
    isLoading,
    hasMore,
    languageFilter,
    searchQuery,
    starSort,
    fetchFeed,
    getFourProjects,
    loadMore,
  };
}
