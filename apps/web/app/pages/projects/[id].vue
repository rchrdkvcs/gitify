<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";

import type { Project } from "~/composables/useSwipe";

interface Contributor {
  id: number;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}

interface ProjectDetail extends Project {
  readme: string | null;
  languages: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
  contributors: Contributor[];
}

const route = useRoute();
const { http } = useHttp();

const project = ref<ProjectDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const data = await http<{ project: ProjectDetail }>(`/projects/${route.params.id}`);
    project.value = data.project;
  } catch {
    error.value = "Impossible de charger ce projet.";
  } finally {
    loading.value = false;
  }
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

const languagesWithPercent = computed(() => {
  if (!project.value?.languages) return [];
  const total = Object.values(project.value.languages).reduce((a, b) => a + b, 0);
  return Object.entries(project.value.languages)
    .map(([name, bytes]) => ({
      name,
      percent: Math.round((bytes / total) * 100),
    }))
    .filter((lang) => lang.percent > 0);
});

const renderedReadme = computed(() => {
  if (!project.value?.readme) return null;
  return DOMPurify.sanitize(marked.parse(project.value.readme) as string);
});
</script>

<template>
  <div class="min-h-screen bg-gray-900 p-6 text-white">
    <div class="mx-auto max-w-6xl">
      <!-- Back navigation -->
      <div class="mb-6 flex items-center gap-4">
        <button @click="$router.back()" class="text-sm text-gray-400 transition hover:text-white">
          ← Retour
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="animate-pulse text-center text-gray-400">Chargement...</div>

      <!-- Error -->
      <div v-else-if="error" class="text-center text-red-400">{{ error }}</div>

      <!-- Content -->
      <template v-else-if="project">
        <!-- Project header -->
        <div class="mb-8 rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="mb-1 flex items-center gap-3">
                <h1 class="text-3xl font-bold text-white">{{ project.name }}</h1>
                <span
                  :class="
                    project.difficulty === 'beginner'
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-red-900/50 text-red-300'
                  "
                  class="rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
                >
                  {{ project.difficulty }}
                </span>
              </div>
              <p class="mb-3 text-gray-400">by {{ project.ownerName }}</p>
              <p v-if="project.description" class="leading-relaxed text-gray-300">
                {{ project.description }}
              </p>
              <p v-else class="text-gray-500 italic">Aucune description disponible.</p>
            </div>

            <a
              :href="project.repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium transition hover:border-blue-500 hover:text-blue-400"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
              GitHub
            </a>
          </div>

          <div
            class="mt-4 flex items-center gap-4 border-t border-gray-700 pt-4 text-xs text-gray-500"
          >
            <span>Créé le {{ formatDate(project.createdAt) }}</span>
            <span>·</span>
            <span>Mis à jour le {{ formatDate(project.updatedAt) }}</span>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left: README -->
          <div class="lg:col-span-2">
            <div class="rounded-2xl border border-gray-700 bg-gray-800 p-6">
              <h2 class="mb-4 text-lg font-semibold text-white">README</h2>
              <div
                v-if="renderedReadme"
                v-html="renderedReadme"
                class="prose max-w-none prose-invert [&_img]:m-0 [&_img]:inline [&_img]:align-middle"
              />
              <p v-else class="text-gray-500 italic">Aucun README disponible.</p>
            </div>
          </div>

          <!-- Right: Stats + Languages + Topics + Contributors -->
          <div class="flex flex-col gap-4">
            <!-- Stats -->
            <div class="rounded-2xl border border-gray-700 bg-gray-800 p-5">
              <h2 class="mb-3 text-sm font-semibold tracking-wide text-gray-400 uppercase">
                Statistiques
              </h2>
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">⭐ Étoiles</span>
                  <span class="font-semibold text-yellow-300">{{
                    project.stars.toLocaleString()
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">🐛 Issues ouvertes</span>
                  <span class="font-semibold text-green-300">{{ project.openIssuesCount }}</span>
                </div>
              </div>
            </div>

            <!-- Languages -->
            <div
              v-if="languagesWithPercent.length"
              class="rounded-2xl border border-gray-700 bg-gray-800 p-5"
            >
              <h2 class="mb-3 text-sm font-semibold tracking-wide text-gray-400 uppercase">
                Langages
              </h2>
              <div class="flex flex-col gap-2">
                <div v-for="lang in languagesWithPercent" :key="lang.name">
                  <div class="mb-1 flex items-center justify-between text-sm">
                    <span class="text-gray-300">{{ lang.name }}</span>
                    <span class="text-gray-500">{{ lang.percent }}%</span>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      class="h-full rounded-full bg-blue-500"
                      :style="{ width: `${lang.percent}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Topics -->
            <div
              v-if="project.topics?.length"
              class="rounded-2xl border border-gray-700 bg-gray-800 p-5"
            >
              <h2 class="mb-3 text-sm font-semibold tracking-wide text-gray-400 uppercase">
                Topics
              </h2>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="topic in project.topics"
                  :key="topic"
                  class="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-400"
                >
                  {{ topic }}
                </span>
              </div>
            </div>

            <!-- Contributors -->
            <div
              v-if="project.contributors?.length"
              class="rounded-2xl border border-gray-700 bg-gray-800 p-5"
            >
              <h2 class="mb-3 text-sm font-semibold tracking-wide text-gray-400 uppercase">
                Contributeurs
              </h2>
              <div class="flex flex-wrap gap-3">
                <a
                  v-for="contributor in project.contributors"
                  :key="contributor.id"
                  :href="contributor.profileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative"
                >
                  <img
                    :src="contributor.avatarUrl"
                    :alt="contributor.login"
                    class="h-10 w-10 rounded-full border-2 border-gray-700 transition group-hover:border-blue-500"
                  />
                  <span
                    class="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-gray-700 px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block"
                  >
                    {{ contributor.login }}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
