<script setup lang="ts">
import type { PaginationMeta, Project } from "@shared/types/index";
import { Head, router } from "@inertiajs/vue3";

const props = defineProps<{ projects: Project[]; meta: PaginationMeta }>();
const projects = ref([...props.projects]);
const meta = ref({ ...props.meta });

watch(
  () => props.meta,
  (value) => {
    meta.value = { ...value };
  },
);
watch(
  () => props.projects,
  (value) => {
    projects.value = [...value];
  },
);

const loading = ref(false);
const error = ref<string | null>(null);

function goToPage(page: number) {
  router.get(
    "/favorites",
    { page },
    {
      preserveState: true,
      preserveScroll: true,
      onStart: () => {
        loading.value = true;
        error.value = null;
      },
      onFinish: () => {
        loading.value = false;
      },
      onError: () => {
        error.value = "Impossible de charger tes favoris. Vérifie ta connexion et réessaie.";
      },
    },
  );
}

function handleFavoriteChange(projectId: string, isFavorite: boolean) {
  if (isFavorite) return;
  projects.value = projects.value.filter((project) => project.id !== projectId);
  meta.value.total = Math.max(0, meta.value.total - 1);
}

const countLabel = computed(() =>
  meta.value.total === 1 ? "1 projet gardé" : `${meta.value.total} projets gardés`,
);
</script>

<template>
  <Head title="Favoris" />

  <PageHeader
    eyebrow="Favoris"
    title="Tes projets gardés"
    description="Les projets que tu as mis de côté pendant ton exploration."
  >
    <template v-if="projects.length" #actions>
      <UButton
        to="/explore"
        label="Explorer les projets"
        trailing-icon="lucide:arrow-right"
        color="neutral"
        variant="outline"
      />
    </template>
  </PageHeader>

  <FrameSection>
    <div
      v-if="projects.length || loading"
      class="flex items-center justify-between border-b border-default px-4 py-3 font-mono text-xs text-muted sm:px-5"
    >
      <p role="status">{{ countLabel }}</p>
      <p v-if="meta.lastPage > 1" class="tabular-nums">
        Page {{ meta.currentPage }} sur {{ meta.lastPage }}
      </p>
    </div>

    <ProjectGrid v-if="loading">
      <ProjectGridItem v-for="n in 6" :key="n">
        <ProjectCardSkeleton />
      </ProjectGridItem>
    </ProjectGrid>

    <EmptyState
      v-else-if="error"
      icon="lucide:wifi-off"
      title="Chargement impossible"
      :description="error"
    >
      <UButton
        label="Réessayer"
        color="neutral"
        variant="outline"
        @click="goToPage(meta.currentPage)"
      />
    </EmptyState>

    <EmptyState
      v-else-if="projects.length === 0"
      icon="lucide:heart"
      title="Aucun favori pour l’instant"
      description="Touche le cœur d’un projet pendant ton exploration pour le retrouver ici."
    >
      <UButton to="/explore" label="Explorer les projets" trailing-icon="lucide:arrow-right" />
    </EmptyState>

    <template v-else>
      <ProjectGrid>
        <ProjectGridItem v-for="project in projects" :key="project.id">
          <ProjectCard :project="project" @favorite-change="handleFavoriteChange" />
        </ProjectGridItem>
      </ProjectGrid>
    </template>
  </FrameSection>

  <FrameSection
    v-if="meta.lastPage > 1 && !error"
    inner-class="flex justify-between px-4 py-4 sm:px-5"
  >
    <UButton
      icon="lucide:arrow-left"
      label="Précédent"
      color="neutral"
      variant="outline"
      :disabled="meta.currentPage === 1 || loading"
      @click="goToPage(meta.currentPage - 1)"
    />
    <UButton
      trailing-icon="lucide:arrow-right"
      label="Suivant"
      color="neutral"
      variant="outline"
      :disabled="meta.currentPage === meta.lastPage || loading"
      @click="goToPage(meta.currentPage + 1)"
    />
  </FrameSection>
</template>
