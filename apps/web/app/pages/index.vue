<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { ProjectGroup } from "~/types/projects";

const projectsStore = useProjectsStore();
await projectsStore.fetchVitrine();

const selectedLanguage = ref("Tous les langages");
const filteredShowcaseData = ref<ProjectGroup[]>([]);

const availableLanguages = computed(() => {
  if (!projectsStore.showcaseData) return ["Tous les langages"];
  return ["Tous les langages", ...projectsStore.showcaseData.map((group) => group.language)];
});

const updateShowcaseData = () => {
  if (!projectsStore.showcaseData) return;

  if (selectedLanguage.value === "Tous les langages") {
    const allProjects = projectsStore.showcaseData.flatMap((group) => group.projects);

    if (import.meta.server) {
      filteredShowcaseData.value = [
        { language: "Tous les langages", projects: allProjects.slice(0, 6) },
      ];
      return;
    }

    const shuffled = [...allProjects];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    filteredShowcaseData.value = [
      { language: "Tous les langages", projects: shuffled.slice(0, 6) },
    ];
  } else {
    filteredShowcaseData.value = projectsStore.showcaseData.filter(
      (group) => group.language.toLowerCase() === selectedLanguage.value.toLowerCase(),
    );
  }
};

watch(selectedLanguage, updateShowcaseData);
watch(() => projectsStore.showcaseData, updateShowcaseData, { immediate: true });

onMounted(() => {
  if (selectedLanguage.value === "Tous les langages") updateShowcaseData();
});
</script>

<template>
  <UPageHero
    class="py-32"
    description="Le tremplin des développeurs juniors. Trouvez des Good First Issues, fusionnez votre première PR et faites décoller votre carrière aux côtés d'une communauté de passionnés."
    :links="[
      { label: 'Commencer à contribuer', to: '/explore', color: 'brand', icon: 'lucide:rocket' },
      { label: 'En savoir plus', to: '/about', color: 'secondary', icon: 'lucide:book-open' },
    ]"
  >
    <template #top>
      <HeroBackground />
    </template>

    <template #title>
      <h1 class="title text-5xl">Coder, Collaborer, <span class="text-primary">Conquérir</span></h1>
    </template>
  </UPageHero>

  <UContainer class="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
    <UPageCard
      v-for="feature in featuresItems"
      :key="feature.title"
      :title="feature.title"
      :description="feature.description"
      :icon="feature.icon"
      :ui="{
        container: feature.bgClass,
        leading: feature.wrapperClass,
        leadingIcon: feature.iconColorClass,
      }"
    />
  </UContainer>

  <UContainer class="flex flex-col py-8 lg:gap-8 lg:py-16 xl:gap-16 xl:py-20">
    <div class="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold lg:text-2xl xl:text-4xl">Repositories à la une</h3>
        <p class="text-muted xl:text-lg">
          Découvrez des projets qui ont besoin de votre aide dès maintenant.
        </p>
      </div>

      <div class="w-full shrink-0 sm:w-72">
        <USelectMenu
          v-model="selectedLanguage"
          :items="availableLanguages"
          icon="lucide:code"
          size="lg"
          class="w-full capitalize"
        />
      </div>
    </div>

    <UPageGrid>
      <template v-for="group in filteredShowcaseData" :key="group.language">
        <ProjectCard v-for="project in group.projects" :key="project.id" :project="project" />
      </template>
    </UPageGrid>

    <UButton
      trailing-icon="lucide:arrow-right"
      label="View All Repositories"
      color="secondary"
      variant="ghost"
      to="/explore"
      class="mx-auto w-fit"
      block
    />
  </UContainer>

  <UPageSection
    title="Prêt à te démarquer ?"
    description="Connecte ton compte GitHub dès aujourd'hui et commence à bâtir ton portfolio de développeur avec des contributions concrètes."
    :ui="{
      root: 'bg-linear-to-t from-[#1F4F41]/20 to-transparent',
      header: 'flex flex-col items-center',
      title: 'font-jetbrains',
      description: 'w-auto lg:w-1/2',
    }"
    :links="[
      { label: 'Start Contributing', to: '/explore', color: 'brand', icon: 'lucide:rocket' },
    ]"
  />
</template>
