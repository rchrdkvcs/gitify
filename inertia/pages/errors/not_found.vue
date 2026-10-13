<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

defineProps<{ message: string }>();
</script>

<template>
  <Head title="Page introuvable" />

  <PageHeader eyebrow="Erreur 404" title="Page introuvable" :description="message" />

  <FrameSection>
    <EmptyState
      icon="lucide:compass"
      title="Rien à explorer ici"
      description="Le lien est peut-être erroné, ou le projet a été retiré du catalogue."
    >
      <UButton to="/explore" label="Explorer les projets" trailing-icon="lucide:arrow-right" />
      <UButton to="/" label="Retour à l’accueil" color="neutral" variant="outline" />
    </EmptyState>
  </FrameSection>
</template>
