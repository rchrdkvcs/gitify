<script setup lang="ts">
import type { ShowcaseLanguageResult } from "@shared/types/index";
import { Head } from "@inertiajs/vue3";

const props = defineProps<{ languages: ShowcaseLanguageResult[] }>();

const authStore = useAuth();
const isLoading = ref(false);

const handleLogin = () => {
  isLoading.value = true;
  window.location.href = authStore.authenticate();
};

const stats = computed(() => [
  {
    value: String(props.languages?.reduce((sum, group) => sum + group.projects.length, 0) ?? 0),
    label: "projets en vitrine",
  },
  { value: String(props.languages?.length ?? 0), label: "langages suivis" },
  { value: "3", label: "niveaux d’expérience" },
  { value: "24 h", label: "entre deux synchronisations GitHub" },
]);
</script>

<template>
  <Head title="Trouve ta première contribution open source">
    <meta
      name="description"
      content="Gitify trouve des projets GitHub adaptés à ton niveau et à tes langages, avec des issues prêtes à être prises."
    />
  </Head>

  <FrameSection>
    <HeroCommitGraph class="min-h-[min(46rem,calc(100dvh-var(--ui-header-height)))]">
      <p
        class="mb-8 inline-flex items-center gap-2 border border-default bg-default px-3 py-1.5 font-mono text-xs text-muted"
      >
        <span class="size-1.5 bg-primary" aria-hidden="true" />
        Open source · premières contributions
      </p>

      <h1 class="display">Ta première contribution open source commence ici.</h1>

      <p class="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
        Gitify trouve des projets GitHub adaptés à ton niveau et à tes langages, avec des issues
        prêtes à être prises. Choisis, clone, ouvre ta pull request.
      </p>

      <div class="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row [&>*]:justify-center">
        <UButton
          to="/explore"
          trailing-icon="lucide:arrow-right"
          label="Explorer les projets"
          size="lg"
        />
        <UButton
          v-if="!authStore.isAuthenticated"
          icon="lucide:github"
          label="Se connecter avec GitHub"
          color="neutral"
          variant="outline"
          size="lg"
          :loading="isLoading"
          @click="handleLogin"
        />
        <UButton
          v-else
          to="/favorites"
          label="Mes favoris"
          color="neutral"
          variant="outline"
          size="lg"
        />
      </div>

      <p v-if="!authStore.isAuthenticated" class="mt-6 font-mono text-xs text-dimmed">
        Sans compte pour explorer · connexion GitHub pour garder tes favoris
      </p>
    </HeroCommitGraph>
  </FrameSection>

  <FrameSection>
    <dl class="grid grid-cols-2 gap-px bg-(--ui-border) lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex flex-col-reverse gap-1 bg-default px-4 py-6 sm:px-8 sm:py-8"
      >
        <dt class="text-sm text-muted">{{ stat.label }}</dt>
        <dd class="font-mono text-2xl text-highlighted tabular-nums sm:text-3xl">
          {{ stat.value }}
        </dd>
      </div>
    </dl>
  </FrameSection>

  <HowItWorks />
  <FeatureGrid />
  <ShowcaseSection :languages="languages" />
  <CtaSection />
</template>
