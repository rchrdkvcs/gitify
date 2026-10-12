<script setup lang="ts">
type FooterLink = { label: string; to: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Produit",
    links: [
      { label: "Explorer", to: "/explore" },
      { label: "Favoris", to: "/favorites" },
      { label: "Préférences", to: "/preferences" },
    ],
  },
  {
    title: "Apprendre",
    links: [
      { label: "Ressources", to: "/ressources" },
      { label: "Communauté", to: "/community" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "Code source", to: "https://github.com/rchrdkvcs/gitify", external: true },
      {
        label: "Signaler un problème",
        to: "https://github.com/rchrdkvcs/gitify/issues",
        external: true,
      },
    ],
  },
];

const year = new Date().getFullYear();
</script>

<template>
  <footer>
    <FrameSection :bordered="false" as="div" inner-class="px-4 sm:px-8">
      <div class="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div class="flex flex-col gap-4">
          <ULink to="/" aria-label="Gitify, accueil" class="w-fit text-highlighted">
            <AppLogo class="h-6 w-auto" />
          </ULink>
          <p class="max-w-xs text-sm leading-relaxed text-muted">
            Des projets open source adaptés à ton niveau, pour décrocher ta première contribution.
          </p>
        </div>

        <nav v-for="column in columns" :key="column.title" :aria-label="column.title">
          <p class="eyebrow mb-4">{{ column.title }}</p>
          <ul class="flex flex-col gap-2.5">
            <li v-for="link in column.links" :key="link.label">
              <ULink
                :to="link.to"
                :target="link.external ? '_blank' : undefined"
                class="inline-flex items-center gap-1 text-sm text-toned transition-colors hover:text-highlighted"
              >
                {{ link.label }}
                <UIcon
                  v-if="link.external"
                  name="lucide:arrow-up-right"
                  class="size-3.5 text-dimmed"
                  aria-hidden="true"
                />
              </ULink>
            </li>
          </ul>
        </nav>
      </div>

      <div
        class="flex flex-col gap-2 border-t border-default py-6 font-mono text-xs text-dimmed sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ year }} Gitify</p>
        <p>Données issues de l’API publique GitHub.</p>
      </div>
    </FrameSection>
  </footer>
</template>
