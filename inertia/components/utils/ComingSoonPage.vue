<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  previewItems: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}>();
</script>

<template>
  <FrameSection inner-class="px-4 py-16 sm:px-8 sm:py-24">
    <div class="flex flex-col items-start gap-6">
      <p
        class="inline-flex items-center gap-2 border border-default px-3 py-1.5 font-mono text-xs text-muted"
      >
        <span class="size-1.5 border border-accented" aria-hidden="true" />
        {{ eyebrow }}
      </p>
      <h1 class="display max-w-3xl">{{ title }}</h1>
      <p class="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        {{ description }}
      </p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <UButton
          to="/explore"
          label="Explorer les projets"
          trailing-icon="lucide:arrow-right"
          size="lg"
        />
        <UButton to="/" label="Retour à l’accueil" color="neutral" variant="outline" size="lg" />
      </div>
    </div>
  </FrameSection>

  <FrameSection>
    <div class="border-b border-default px-4 py-4 sm:px-8">
      <h2 class="eyebrow">Ce qui arrive</h2>
    </div>
    <ul class="grid gap-px bg-(--ui-border) sm:grid-cols-3">
      <li
        v-for="item in previewItems"
        :key="item.title"
        class="flex flex-col gap-3 bg-default p-6 sm:p-8"
      >
        <div class="flex items-center gap-2.5">
          <UIcon :name="item.icon" class="size-4.5 text-muted" aria-hidden="true" />
          <h3 class="font-medium text-highlighted">{{ item.title }}</h3>
        </div>
        <p class="text-sm leading-relaxed text-muted">{{ item.description }}</p>
      </li>
    </ul>
  </FrameSection>
</template>
