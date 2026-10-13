<script setup lang="ts">
import IllustrationIssues from "./IllustrationIssues.vue";
import IllustrationLanguages from "./IllustrationLanguages.vue";
import IllustrationMerge from "./IllustrationMerge.vue";

const steps = [
  {
    number: "01",
    title: "Dis-nous où tu en es",
    description:
      "Ton niveau, ce que tu aimes faire et tes langages. Gitify devine tes langages depuis ton profil GitHub : tu n’as qu’à ajuster.",
    illustration: IllustrationLanguages,
  },
  {
    number: "02",
    title: "Trouve le bon projet",
    description:
      "Ton fil réunit jusqu’à 60 projets répartis entre tes langages. Filtre, cherche par nom, trie par popularité et garde les meilleurs en favoris.",
    illustration: IllustrationIssues,
  },
  {
    number: "03",
    title: "Ouvre ta pull request",
    description:
      "Chaque fiche projet réunit le README, la commande de clonage et un lien direct vers les issues ouvertes. Il ne reste plus qu’à coder.",
    illustration: IllustrationMerge,
  },
];
</script>

<template>
  <FrameSection id="comment-ca-marche" class="scroll-mt-(--ui-header-height)">
    <div class="border-b border-default px-4 py-14 sm:px-8 sm:py-20">
      <SectionHeading
        eyebrow="Comment ça marche"
        title="De l’inscription à ta première PR, en trois étapes."
      />
    </div>

    <ol class="grid md:grid-cols-3">
      <li
        v-for="(step, index) in steps"
        :key="step.number"
        class="flex flex-col border-default"
        :class="index > 0 ? 'border-t md:border-t-0 md:border-l' : ''"
      >
        <div class="bg-grid border-b border-default bg-muted/40 px-6 py-8">
          <component :is="step.illustration" />
        </div>
        <div class="flex flex-col gap-3 p-6 sm:p-8">
          <span class="font-mono text-xs text-primary">{{ step.number }}</span>
          <h3 class="text-lg font-medium text-highlighted">{{ step.title }}</h3>
          <p class="text-sm leading-relaxed text-muted">{{ step.description }}</p>
        </div>
      </li>
    </ol>
  </FrameSection>
</template>
