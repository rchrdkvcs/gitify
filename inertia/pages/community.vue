<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

const previewItems = [
  {
    icon: "lucide:messages-square",
    title: "Échanger",
    description: "Discute avec d’autres contributeurs et partage ton expérience.",
  },
  {
    icon: "lucide:users",
    title: "Trouver son équipe",
    description: "Rencontre des développeurs qui partagent tes envies et tes objectifs.",
  },
  {
    icon: "lucide:calendar",
    title: "Participer",
    description: "Retrouve les prochains rendez-vous et événements de la communauté.",
  },
];
</script>

<template>
  <Head title="Communauté">
    <meta
      name="description"
      content="La communauté Gitify arrive bientôt : entraide, échanges et événements autour de l’open source."
    />
  </Head>
  <ComingSoonPage
    eyebrow="Bientôt disponible"
    title="La communauté Gitify arrive."
    description="Un espace pour s’entraider, apprendre à plusieurs et faire grandir ses contributions open source. On le prépare."
    :preview-items="previewItems"
  />
</template>
