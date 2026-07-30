<script setup lang="ts">
import type { ArchiveHoverInfo, ArchiveSceneHandle, ArchiveSceneProject } from "~/types/archive";

const { isOpen, isLoading, projects, loadError, close } = useArchiveEasterEgg();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

const hovered = ref<ArchiveHoverInfo | null>(null);
const sceneLoading = ref(false);
const sceneError = ref<string | null>(null);

let sceneHandle: ArchiveSceneHandle | null = null;
let resizeObserver: ResizeObserver | null = null;

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function openGithub(project: ArchiveSceneProject) {
  if (!project.repositoryUrl) return;
  window.open(project.repositoryUrl, "_blank", "noopener,noreferrer");
}

async function mountScene() {
  if (!import.meta.client) return;
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  sceneHandle?.dispose();
  sceneHandle = null;
  hovered.value = null;
  sceneError.value = null;
  sceneLoading.value = true;

  try {
    const { createArchiveScene } = await import("~/lib/archive-scene");

    sceneHandle = await createArchiveScene({
      canvas,
      projects: projects.value,
      onHover: (info) => {
        hovered.value = info;
      },
      onSelect: (project) => {
        openGithub(project);
      },
    });

    const applySize = () => {
      const rect = container.getBoundingClientRect();
      sceneHandle?.setSize(rect.width, rect.height);
    };
    applySize();

    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(container);
  } catch (err) {
    console.error("[archive] failed to mount scene", err);
    sceneError.value = "Impossible de charger les backrooms.";
    sceneHandle?.dispose();
    sceneHandle = null;
  } finally {
    sceneLoading.value = false;
  }
}

function teardownScene() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  sceneHandle?.dispose();
  sceneHandle = null;
  hovered.value = null;
  sceneLoading.value = false;
  sceneError.value = null;
}

watch(
  () => [isOpen.value, isLoading.value, projects.value] as const,
  async ([open, loading]) => {
    if (!open) {
      teardownScene();
      return;
    }
    if (loading) return;
    await nextTick();
    await mountScene();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  teardownScene();
});

watch(isOpen, (open) => {
  if (!import.meta.client) return;
  document.body.style.overflow = open ? "hidden" : "";
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="archive-overlay fixed inset-0 z-[100] flex flex-col bg-[#1a1810]"
      role="dialog"
      aria-modal="true"
      aria-label="Backrooms des archives"
    >
      <div ref="containerRef" class="relative min-h-0 flex-1">
        <canvas ref="canvasRef" class="block h-full w-full touch-none" />

        <!-- Crosshair -->
        <div
          class="pointer-events-none absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-50"
          aria-hidden="true"
        >
          <div class="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-[#e8d48b]" />
          <div class="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-[#e8d48b]" />
        </div>

        <!-- Loading -->
        <div
          v-if="isLoading || sceneLoading"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1a1810]/90"
        >
          <p class="font-jetbrains text-sm tracking-widest text-[#e8d48b] uppercase">
            {{ isLoading ? "Ouverture des archives…" : "Chargement des backrooms…" }}
          </p>
          <p class="text-xs text-white/40">Les modèles 3D peuvent prendre quelques secondes</p>
        </div>

        <!-- Error -->
        <div
          v-else-if="loadError || sceneError"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a1810]/90 px-6 text-center"
        >
          <p class="text-red-400">{{ loadError || sceneError }}</p>
          <button
            type="button"
            class="rounded-lg border border-[#e8d48b]/40 px-4 py-2 text-sm text-[#e8d48b] hover:bg-[#e8d48b]/10"
            @click="close"
          >
            Fermer (Esc)
          </button>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!isLoading && !sceneLoading && projects.length === 0"
          class="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-6"
        >
          <div
            class="max-w-md rounded-xl border border-white/10 bg-black/60 px-5 py-4 text-center backdrop-blur-sm"
          >
            <p class="font-jetbrains text-sm text-[#e8d48b]">Aucune caisse pour l’instant</p>
            <p class="mt-2 text-sm text-white/60">
              Ajoutez des projets à vos favoris pour remplir les backrooms.
            </p>
          </div>
        </div>

        <!-- Crosshair aim card — fixed just above screen center -->
        <div
          v-if="hovered"
          class="pointer-events-none absolute top-[42%] left-1/2 z-10 w-64 max-w-[min(16rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-full"
        >
          <div
            class="rounded-lg border border-[#e8d48b]/35 bg-black/80 px-3 py-2.5 shadow-xl backdrop-blur-md"
          >
            <p class="truncate font-jetbrains text-sm text-white">
              {{ hovered.project.name }}
            </p>
            <p class="truncate text-xs text-white/55">{{ hovered.project.ownerName }}</p>
            <p
              v-if="hovered.project.description"
              class="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/45"
            >
              {{ hovered.project.description }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span class="rounded-full bg-white/10 px-1.5 py-0.5 text-yellow-400">
                ★ {{ formatStars(hovered.project.stars) }}
              </span>
              <span
                v-if="hovered.project.language"
                class="rounded-full bg-white/10 px-1.5 py-0.5 text-[#e8d48b]"
              >
                {{ hovered.project.language }}
              </span>
              <span class="ml-auto text-white/35">clic → GitHub</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div
          class="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-[11px] tracking-wide text-white/55 backdrop-blur-sm"
        >
          <span><kbd class="text-[#e8d48b]">Clic</kbd> verrouiller la souris</span>
          <span class="opacity-40">·</span>
          <span><kbd class="text-[#e8d48b]">Souris</kbd> regarder</span>
          <span class="opacity-40">·</span>
          <span><kbd class="text-[#e8d48b]">WASD</kbd> marcher</span>
          <span class="opacity-40">·</span>
          <span><kbd class="text-[#e8d48b]">Clic</kbd> caisse → GitHub</span>
          <span class="opacity-40">·</span>
          <span><kbd class="text-[#e8d48b]">Esc</kbd> quitter</span>
        </div>

        <!-- Top bar -->
        <div
          class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4"
        >
          <p class="font-jetbrains text-xs tracking-[0.25em] text-[#e8d48b]/75 uppercase">
            Backrooms · Archives
          </p>
          <button
            type="button"
            class="pointer-events-auto rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white/60 backdrop-blur hover:border-[#e8d48b]/40 hover:text-[#e8d48b]"
            @click="close"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
kbd {
  font-family: var(--font-jetbrains), monospace;
  font-size: 10px;
}
</style>
