<script setup lang="ts">
defineProps<{
  level?: string;
  languages: string[];
  user?: {
    name?: string;
    avatarUrl?: string;
  } | null;
}>();
</script>

<template>
  <article class="preferences-card mx-auto flex w-full max-w-2xl cursor-default flex-col">
    <section class="flex items-center gap-6">
      <UUser
        :ui="{ avatar: 'size-20 border border-border' }"
        :avatar="{ src: user?.avatarUrl, alt: user?.name }"
      />
      <div>
        <span class="text-sm text-brand-green uppercase">Connecté en tant que</span>
        <div class="flex items-center gap-2">
          <UIcon class="size-6" name="ix:user-profile" />
          <p class="text-lg">{{ user?.name }}</p>
        </div>
      </div>
    </section>

    <USeparator />

    <section class="grid grid-cols-1 grid-rows-2 gap-4 md:grid-cols-2 md:grid-rows-1">
      <div>
        <div class="flex items-center gap-2">
          <UIcon class="size-4 text-muted" name="mage:chart-fill" />
          <p class="text-sm tracking-wide text-muted uppercase">Niveau d'expérience</p>
        </div>
        <p class="text-lg font-medium">{{ level }}</p>
      </div>

      <div>
        <div class="flex items-center gap-2">
          <UIcon class="size-4 text-muted" name="material-symbols:code-rounded" />
          <p class="text-sm tracking-wide text-muted uppercase">Langages favoris</p>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <UBadge v-for="lang in languages" :key="lang" color="primary" variant="subtle">
            {{ lang }}
          </UBadge>
        </div>
      </div>
    </section>
  </article>
</template>
