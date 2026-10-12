<script setup lang="ts">
const features = [
  {
    icon: "lucide:github",
    title: "Connexion GitHub",
    description:
      "Un clic, aucun mot de passe. Ta session reste côté serveur, jamais dans le navigateur.",
  },
  {
    icon: "lucide:sliders-horizontal",
    title: "Fil personnalisé",
    description:
      "Ton niveau et tes langages décident des projets proposés. Modifiables à tout moment.",
  },
  {
    icon: "lucide:tag",
    title: "Issues étiquetées",
    description:
      "Des projets qui affichent des good first issues ou des help wanted, prêts à être pris.",
  },
  {
    icon: "lucide:heart",
    title: "Favoris",
    description: "Garde les projets qui t’intéressent de côté et retrouve-les en un clic.",
  },
  {
    icon: "lucide:file-text",
    title: "Fiches projet complètes",
    description: "README, langages, contributeurs et commande de clonage, au même endroit.",
  },
  {
    icon: "lucide:refresh-cw",
    title: "Données à jour",
    description: "Les projets sont synchronisés depuis l’API GitHub et rafraîchis chaque jour.",
  },
];
</script>

<template>
  <FrameSection>
    <div class="border-b border-default px-4 py-14 sm:px-8 sm:py-20">
      <SectionHeading
        eyebrow="Fonctionnalités"
        title="Moins de temps à chercher, plus de temps à contribuer."
        description="Gitify fait le tri dans les millions de dépôts GitHub pour ne garder que ceux où une première contribution est réaliste."
      />
    </div>

    <ul class="grid gap-px bg-(--ui-border) sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="feature in features"
        :key="feature.title"
        class="flex flex-col gap-3 bg-default p-6 sm:p-8"
      >
        <div class="flex items-center gap-2.5 text-highlighted">
          <UIcon :name="feature.icon" class="size-4.5 text-muted" aria-hidden="true" />
          <h3 class="font-medium">{{ feature.title }}</h3>
        </div>
        <p class="text-sm leading-relaxed text-muted">{{ feature.description }}</p>
      </li>
    </ul>
  </FrameSection>
</template>
