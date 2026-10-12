<script setup lang="ts">
const authStore = useAuth();
const isLoading = ref(false);

const handleLogin = () => {
  isLoading.value = true;
  window.location.href = authStore.authenticate();
};
</script>

<template>
  <FrameSection inner-class="px-4 py-16 sm:px-8 sm:py-24">
    <div class="mb-12 flex items-center justify-center gap-3" aria-hidden="true">
      <span class="hidden h-px w-48 bg-(--ui-border) sm:block" />
      <span class="hidden size-1.5 border border-accented sm:block" />
      <span class="border border-accented px-3 py-1 font-mono text-xs text-toned">
        git commit -m "first contribution"
      </span>
      <span class="hidden size-1.5 border border-accented sm:block" />
      <span class="hidden h-px w-48 bg-(--ui-border) sm:block" />
    </div>

    <div class="frame-corners border border-default px-6 py-14 sm:px-12 sm:py-20">
      <CornerMarks />
      <div class="flex flex-col items-center gap-5 text-center">
        <h2 class="section-title max-w-2xl">Prêt pour ta première pull request ?</h2>
        <p class="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Parcours le catalogue, choisis un projet à ta mesure et repère une issue pour débuter.
          Connecte GitHub pour garder tes favoris.
        </p>
        <div class="mt-4 flex flex-col gap-3 sm:flex-row">
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
        </div>
      </div>
    </div>
  </FrameSection>
</template>
