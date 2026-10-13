import { router } from "@inertiajs/vue3";
import { onScopeDispose, ref, watch } from "vue";
import type { PaginationMeta, Project } from "../../shared/types/index.js";

export interface FavoritePageSource {
  projects: Project[];
  meta: PaginationMeta;
}

export interface FavoritePageVisitCallbacks {
  onCancelToken(token: { cancel(): void }): void;
  onSuccess(page: FavoritePageSource): void;
  onFinish(): void;
  onError(): void;
  onCancel(): void;
  onNetworkError(): false;
  onHttpException(): false;
}

export type FavoritePageVisit = (page: number, callbacks: FavoritePageVisitCallbacks) => void;

const inertiaVisit: FavoritePageVisit = (page, callbacks) => {
  router.get(
    "/favorites",
    { page },
    {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ["projects", "meta"],
      ...callbacks,
      onSuccess: (response: { props: Record<string, unknown> }) =>
        callbacks.onSuccess({
          projects: response.props.projects as Project[],
          meta: response.props.meta as PaginationMeta,
        }),
    },
  );
};

export function useFavoritePage(
  source: FavoritePageSource,
  visit: FavoritePageVisit = inertiaVisit,
) {
  const projects = ref([...source.projects]);
  const meta = ref({ ...source.meta });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const removedIds = new Set<string>();
  let visitId = 0;
  let cancelVisit: (() => void) | undefined;

  watch(
    () => source.meta,
    (value) => {
      meta.value = { ...value };
    },
  );
  watch(
    () => source.projects,
    (value) => {
      projects.value = value.filter((project) => !removedIds.has(project.id));
    },
  );

  function goToPage(page: number) {
    const currentVisit = ++visitId;
    cancelVisit?.();
    loading.value = true;
    error.value = null;
    const fail = () => {
      if (currentVisit !== visitId) return;
      error.value = "Impossible de charger tes favoris. Vérifie ta connexion et réessaie.";
    };
    visit(page, {
      onCancelToken: (token) => {
        if (currentVisit !== visitId) {
          token.cancel();
          return;
        }
        cancelVisit = () => token.cancel();
      },
      onSuccess: (response) => {
        if (currentVisit !== visitId) return;
        removedIds.clear();
        projects.value = [...response.projects];
        meta.value = { ...response.meta };
      },
      onFinish: () => {
        if (currentVisit !== visitId) return;
        loading.value = false;
        cancelVisit = undefined;
      },
      onError: fail,
      onCancel: fail,
      onNetworkError: () => {
        fail();
        return false;
      },
      onHttpException: () => {
        fail();
        return false;
      },
    });
  }

  onScopeDispose(() => {
    visitId++;
    cancelVisit?.();
  });

  function handleFavoriteChange(projectId: string, isFavorite: boolean) {
    if (isFavorite || removedIds.has(projectId)) return;
    removedIds.add(projectId);
    projects.value = projects.value.filter((project) => project.id !== projectId);
    meta.value.total = Math.max(0, meta.value.total - 1);
    goToPage(meta.value.currentPage);
  }

  return { projects, meta, loading, error, goToPage, handleFavoriteChange };
}
