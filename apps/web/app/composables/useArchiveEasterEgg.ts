import type { Project, PaginationMeta } from "@gitify/types";

const SEQUENCE = ["g", "i", "t", "i", "f", "y"] as const;
const SEQUENCE_TIMEOUT_MS = 2500;
const MAX_PROJECTS = 24;

/** Module-level so the combo works regardless of which component calls the composable. */
const keyBuffer: string[] = [];
let resetTimer: ReturnType<typeof setTimeout> | null = null;
let boundHandler: ((event: KeyboardEvent) => void) | null = null;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

/** Desktop = not a coarse/touch-primary phone viewport. Laptops always pass. */
function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const coarseOnly =
    window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches;
  const tiny = window.matchMedia("(max-width: 767px)").matches;
  return !(coarseOnly && tiny);
}

function clearBuffer() {
  keyBuffer.length = 0;
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }
}

function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    keyBuffer.length = 0;
    resetTimer = null;
  }, SEQUENCE_TIMEOUT_MS);
}

function normalizeKey(event: KeyboardEvent): string {
  if (event.key.length === 1) {
    return event.key.toLowerCase();
  }
  const codeMap: Record<string, string> = {
    KeyG: "g",
    KeyI: "i",
    KeyT: "t",
    KeyF: "f",
    KeyY: "y",
  };
  return codeMap[event.code] ?? "";
}

export function useArchiveEasterEgg() {
  const authStore = useAuthStore();
  const { http } = useHttp();
  const projectsStore = useProjectsStore();

  const isOpen = useState("archive-easter-egg-open", () => false);
  const isLoading = useState("archive-easter-egg-loading", () => false);
  const projects = useState<Project[]>("archive-easter-egg-projects", () => []);
  const loadError = useState<string | null>("archive-easter-egg-error", () => null);

  async function fetchArchiveProjects(): Promise<Project[]> {
    const favoritesResponse = await http<{ projects: Project[]; meta: PaginationMeta }>(
      "/projects/favorites?page=1",
    );
    let result = [...(favoritesResponse.projects ?? [])];

    if (result.length < MAX_PROJECTS && (favoritesResponse.meta?.lastPage ?? 1) > 1) {
      try {
        const page2 = await http<{ projects: Project[]; meta: PaginationMeta }>(
          "/projects/favorites?page=2",
        );
        const seen = new Set(result.map((p) => p.id));
        for (const p of page2.projects ?? []) {
          if (!seen.has(p.id)) {
            result.push(p);
            seen.add(p.id);
          }
          if (result.length >= MAX_PROJECTS) break;
        }
      } catch {
        // ignore page 2 failures
      }
    }

    if (result.length < MAX_PROJECTS) {
      const feed = await projectsStore.fetchFeed();
      const seen = new Set(result.map((p) => p.id));
      for (const p of feed) {
        if (!seen.has(p.id)) {
          result.push(p);
          seen.add(p.id);
        }
        if (result.length >= MAX_PROJECTS) break;
      }
    }

    return result.slice(0, MAX_PROJECTS);
  }

  async function open() {
    if (!authStore.isAuthenticated) return;
    if (!isDesktop()) return;
    if (isOpen.value) return;

    isOpen.value = true;
    isLoading.value = true;
    loadError.value = null;
    projects.value = [];

    try {
      projects.value = await fetchArchiveProjects();
    } catch {
      loadError.value = "Impossible de charger les archives.";
      projects.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function close() {
    isOpen.value = false;
    isLoading.value = false;
    loadError.value = null;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;

    if (isOpen.value) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      return;
    }

    if (!authStore.isAuthenticated) return;
    if (!isDesktop()) return;

    const key = normalizeKey(event);
    if (!key) return;

    const expected = SEQUENCE[keyBuffer.length];
    if (key === expected) {
      keyBuffer.push(key);
      scheduleReset();
      if (keyBuffer.length === SEQUENCE.length) {
        clearBuffer();
        event.preventDefault();
        void open();
      }
    } else if (key === SEQUENCE[0]) {
      keyBuffer.length = 0;
      keyBuffer.push(key);
      scheduleReset();
    } else {
      clearBuffer();
    }
  }

  function bind() {
    if (!import.meta.client || boundHandler) return;
    boundHandler = onKeydown;
    window.addEventListener("keydown", boundHandler, true);
  }

  function unbind() {
    if (!import.meta.client || !boundHandler) return;
    window.removeEventListener("keydown", boundHandler, true);
    boundHandler = null;
    clearBuffer();
  }

  return {
    isOpen,
    isLoading,
    projects,
    loadError,
    open,
    close,
    bind,
    unbind,
    MAX_PROJECTS,
  };
}
