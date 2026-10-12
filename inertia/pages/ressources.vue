<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

const previewItems = [
  {
    icon: "lucide:map",
    title: "Parcours guidés",
    description: "Avance étape par étape, de ton premier fork à ta première pull request.",
  },
  {
    icon: "lucide:book-open-text",
    title: "Guides pratiques",
    description: "Retrouve des explications claires sur Git, GitHub et l’open source.",
  },
  {
    icon: "lucide:wrench",
    title: "Boîte à outils",
    description: "Découvre les outils et bonnes pratiques pour contribuer sereinement.",
  },
];
</script>

<template>
  <Head title="Ressources">
    <meta
      name="description"
      content="Les ressources Gitify arrivent bientôt : guides, outils et parcours pour contribuer à l’open source."
    />
  </Head>
  <ComingSoonPage
    eyebrow="Bientôt disponible"
    title="Des ressources pour aller plus loin."
    description="Des guides concrets, des outils utiles et des parcours pas à pas pour contribuer avec confiance. On les rassemble."
    :preview-items="previewItems"
  />
</template>
