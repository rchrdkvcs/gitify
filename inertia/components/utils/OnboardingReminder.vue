<script setup lang="ts">
const authStore = useAuth();
const onboardingPending = computed(() => !!authStore.user && !authStore.user.onboardedAt);
</script>

<template>
  <FrameSection v-if="onboardingPending" inner-class="px-4 py-3 sm:px-8">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2" role="status">
      <UIcon name="lucide:route" class="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p class="flex-1 text-sm text-toned">
        Ton profil n’est pas terminé : réponds aux questions restantes pour un fil à ta mesure.
      </p>
      <UButton
        to="/onboarding"
        :label="authStore.user?.onboardingStep ? 'Reprendre' : 'Commencer'"
        trailing-icon="lucide:arrow-right"
        size="sm"
      />
    </div>
  </FrameSection>
</template>
