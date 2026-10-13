<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

defineProps<{ status: number; message: string }>();

function reload() {
  window.location.reload();
}
</script>

<template>
  <Head title="Erreur" />

  <PageHeader
    :eyebrow="`Erreur ${status}`"
    title="Un problème est survenu"
    :description="message"
  />

  <FrameSection>
    <EmptyState
      icon="lucide:triangle-alert"
      title="La page n’a pas pu s’afficher"
      description="Réessaie dans quelques instants. Si le problème persiste, reviens à l’accueil."
    >
      <UButton label="Réessayer" icon="lucide:rotate-cw" @click="reload" />
      <UButton to="/" label="Retour à l’accueil" color="neutral" variant="outline" />
    </EmptyState>
  </FrameSection>
</template>
