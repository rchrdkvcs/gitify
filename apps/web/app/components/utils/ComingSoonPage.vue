<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  icon: string;
  previewItems: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}>();
</script>

<template>
  <main class="relative isolate overflow-hidden">
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_20%,rgba(78,222,163,0.12),transparent_35%),linear-gradient(to_bottom,transparent,rgba(20,53,43,0.18))]"
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(166,240,211,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(166,240,211,0.08)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] [background-size:48px_48px] opacity-20"
    />

    <UContainer class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-16">
      <section class="w-full max-w-5xl text-center">
        <div class="mb-8 flex justify-center">
          <div class="coming-soon-icon relative flex size-24 items-center justify-center">
            <div
              class="absolute inset-0 rotate-6 rounded-2xl border border-primary/40 bg-primary/10"
            />
            <div
              class="absolute inset-2 -rotate-6 rounded-xl border border-green-500/30 bg-card/70"
            />
            <UIcon :name="icon" class="relative size-10 text-primary" />
          </div>
        </div>

        <UBadge color="primary" variant="subtle" class="mb-6 uppercase">
          {{ eyebrow }}
        </UBadge>

        <h1 class="title mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-7xl">
          {{ title }}
          <span class="text-primary">{{ highlightedTitle }}</span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base leading-7 text-lightgray sm:text-lg">
          {{ description }}
        </p>

        <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <UButton
            to="/explore"
            color="brand"
            icon="lucide:rocket"
            label="Explorer les projets"
            size="lg"
          />
          <UButton
            to="/"
            color="secondary"
            icon="lucide:arrow-left"
            label="Retour à l'accueil"
            size="lg"
          />
        </div>

        <div class="mt-16 grid gap-3 text-left sm:grid-cols-3">
          <article
            v-for="item in previewItems"
            :key="item.title"
            class="group rounded-lg border border-lightgreen/10 bg-card/20 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-lightgreen/25 hover:bg-card/30"
          >
            <UIcon
              :name="item.icon"
              class="mb-4 size-6 text-green-500 transition-transform duration-300 group-hover:scale-110"
            />
            <h2 class="font-jetbrains font-semibold text-light">{{ item.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-lightgray">{{ item.description }}</p>
          </article>
        </div>

        <div class="mt-12 flex items-center justify-center gap-3 text-sm text-lightgray">
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75"
            />
            <span class="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          <span class="font-jetbrains">En cours de construction</span>
        </div>
      </section>
    </UContainer>
  </main>
</template>

<style scoped>
.coming-soon-icon {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .coming-soon-icon {
    animation: none;
  }
}
</style>
