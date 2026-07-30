<script setup lang="ts">
import type { PaginationMeta, Project } from "@gitify/types";

definePageMeta({
  middleware: "auth",
});

const { http } = useHttp();
const projects = ref<Project[]>([]);
const meta = ref<PaginationMeta | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const page = ref(1);

async function fetchFavorites() {
  loading.value = true;
  error.value = null;

  try {
    const data = await http<{ projects: Project[]; meta: PaginationMeta }>(
      `/projects/favorites?page=${page.value}`,
    );
    projects.value = data.projects;
    meta.value = data.meta;
  } catch {
    error.value = "Impossible de charger vos favoris.";
  } finally {
    loading.value = false;
  }
}

function goToPage(nextPage: number) {
  page.value = nextPage;
  fetchFavorites();
}

function handleFavoriteChange(projectId: string, isFavorite: boolean) {
  if (isFavorite) {
    return;
  }

  projects.value = projects.value.filter((project) => project.id !== projectId);
  if (meta.value) {
    meta.value.total = Math.max(0, meta.value.total - 1);
  }
}

onMounted(fetchFavorites);
</script>

<template>
  <div class="min-h-screen bg-canvas px-4 py-8 text-ink sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="font-jetbrains text-3xl font-bold text-ink">Mes favoris</h1>
          <p class="mt-2 text-muted">Retrouvez rapidement les repositories que vous avez gardés.</p>
        </div>
        <UButton label="Explorer les projets" icon="lucide:search" color="brand" to="/explore" />
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <ProjectCardSkeleton v-for="n in 6" :key="n" />
      </div>

      <div v-else-if="error" class="py-16 text-center">
        <p class="text-red-700">{{ error }}</p>
        <UButton class="mt-4" label="Réessayer" color="secondary" @click="fetchFavorites" />
      </div>

      <div v-else-if="projects.length === 0" class="py-16 text-center text-muted">
        <UIcon name="tabler:heart" class="mx-auto mb-4 size-12 text-primary" />
        <p class="text-xl font-semibold text-ink">Aucun favori pour le moment.</p>
        <p class="mt-2 text-sm">Ajoutez un projet depuis l’exploration pour le retrouver ici.</p>
        <UButton class="mt-6" label="Découvrir les projets" color="brand" to="/explore" />
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 2xl:grid-cols-3">
          <ProjectCard
            v-for="project in projects"
            :key="project.id"
            :project="project"
            class="h-full"
            @favorite-change="handleFavoriteChange"
          />
        </div>

        <div v-if="meta && meta.lastPage > 1" class="mt-8 flex items-center justify-center gap-4">
          <UButton
            icon="lucide:arrow-left"
            label="Précédent"
            color="secondary"
            :disabled="meta.currentPage === 1"
            @click="goToPage(meta.currentPage - 1)"
          />
          <span class="text-sm text-muted">{{ meta.currentPage }} / {{ meta.lastPage }}</span>
          <UButton
            trailing-icon="lucide:arrow-right"
            label="Suivant"
            color="secondary"
            :disabled="meta.currentPage === meta.lastPage"
            @click="goToPage(meta.currentPage + 1)"
          />
        </div>
      </template>
    </div>
  </div>
</template>
