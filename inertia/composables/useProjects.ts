import type { Project } from "@shared/types/index";

// Multiple of 2 and 3 so every grid layout closes on a full row.
const BATCH_COUNT = 12;

export type StarSort = "default" | "most-starred" | "least-starred";

export function useProjects(source: () => Project[]) {
  const pool = computed(source);
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

  function loadMore(count = BATCH_COUNT) {
    visibleCount.value += count;
  }

  watch([languageFilter, searchQuery, starSort], () => {
    visibleCount.value = BATCH_COUNT;
  });

  const total = computed(() => filteredPool.value.length);

  function resetFilters(languages: string[] = []) {
    languageFilter.value = [...languages];
    searchQuery.value = "";
    starSort.value = "default";
  }

  return {
    projects,
    total,
    hasMore,
    languageFilter,
    searchQuery,
    starSort,
    loadMore,
    resetFilters,
  };
}
