<script setup lang="ts">
import type { Project } from "~/composables/useSwipe";

const { http } = useHttp();
const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const data = await http<{ projects: Project[] }>("/projects/liked");
    projects.value = data.projects;
  } catch {
    error.value = "Impossible de charger vos favoris.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-900 p-8 text-white">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-blue-400">Mes favoris ♥</h1>
        <NuxtLink
          to="/swipe"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-700"
        >
          ← Retour au swipe
        </NuxtLink>
      </div>

      <div v-if="loading" class="animate-pulse text-center text-gray-400">Chargement...</div>

      <div v-else-if="error" class="text-center text-red-400">{{ error }}</div>

      <div v-else-if="projects.length === 0" class="text-center text-gray-400">
        <p class="text-xl">Aucun favori pour le moment.</p>
        <p class="mt-2 text-sm">Swipe à droite sur un projet pour le sauvegarder ici !</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="rounded-xl border border-gray-700 bg-gray-800 p-5 shadow-lg"
        >
          <div class="mb-2 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-white">{{ project.name }}</h2>
              <p class="text-sm text-gray-400">by {{ project.ownerName }}</p>
            </div>
            <a
              :href="project.repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg border border-gray-600 p-2 transition hover:border-blue-500 hover:text-blue-400"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
          </div>

          <div class="mb-3 flex flex-wrap gap-2">
            <span
              v-if="project.language"
              class="rounded-full bg-blue-900/50 px-3 py-1 text-xs font-medium text-blue-300"
            >
              {{ project.language }}
            </span>
            <span
              class="rounded-full bg-yellow-900/50 px-3 py-1 text-xs font-medium text-yellow-300"
            >
              ⭐ {{ project.stars.toLocaleString() }}
            </span>
            <span class="rounded-full bg-green-900/50 px-3 py-1 text-xs font-medium text-green-300">
              🐛 {{ project.openIssuesCount }} issues
            </span>
          </div>

          <p class="text-sm text-gray-300">
            {{ project.description ?? "Aucune description disponible." }}
          </p>

          <div v-if="project.topics?.length" class="mt-3 flex flex-wrap gap-1">
            <span
              v-for="topic in project.topics.slice(0, 4)"
              :key="topic"
              class="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-500"
            >
              {{ topic }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
