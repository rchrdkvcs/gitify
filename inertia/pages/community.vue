<script setup lang="ts">
import { Head } from "@inertiajs/vue3";
const metadata = {
  title: "Communauté — Bientôt disponible",
  description:
    "La communauté Gitify arrive bientôt : échanges, entraide et événements autour de l’open source.",
};

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
    icon: "lucide:calendar-heart",
    title: "Participer",
    description: "Retrouve les prochains rendez-vous et événements de la communauté.",
  },
];
</script>

<template>
  <Head :title="metadata.title"><meta name="description" :content="metadata.description" /></Head>
  <ComingSoonPage
    eyebrow="Bientôt disponible"
    title="La communauté prend "
    highlighted-title="forme."
    description="Nous préparons un espace où les développeurs pourront s’entraider, apprendre ensemble et faire grandir leurs contributions open source."
    icon="lucide:users-round"
    :preview-items="previewItems"
  />
</template>
