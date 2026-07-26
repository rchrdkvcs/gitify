<script setup lang="ts">
useSeoMeta({
  title: "Ressources — Bientôt disponible | Gitify",
  description:
    "Les ressources Gitify arrivent bientôt : guides, outils et parcours pour contribuer à l’open source.",
});

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
  <ComingSoonPage
    eyebrow="Bientôt disponible"
    title="De quoi aller "
    highlighted-title="plus loin."
    description="Nous rassemblons des guides concrets, des outils utiles et des parcours accessibles pour t’aider à contribuer avec confiance."
    icon="lucide:library-big"
    :preview-items="previewItems"
  />
</template>
