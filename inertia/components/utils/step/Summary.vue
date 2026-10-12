<script setup lang="ts">
defineProps<{
  level?: string;
  languages: string[];
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
}>();
</script>

<template>
  <div class="border border-default">
    <div class="flex items-center gap-4 border-b border-default p-5 sm:p-6">
      <UAvatar :src="user?.avatarUrl ?? undefined" alt="" size="xl" class="border border-default" />
      <div class="min-w-0">
        <p class="eyebrow">Compte GitHub</p>
        <p class="mt-1 truncate text-lg text-highlighted">{{ user?.name }}</p>
      </div>
    </div>

    <dl class="grid gap-px bg-(--ui-border) sm:grid-cols-2">
      <div class="flex flex-col gap-2 bg-default p-5 sm:p-6">
        <dt class="eyebrow">Niveau</dt>
        <dd class="text-highlighted">{{ level === "expert" ? "Confirmé" : "Débutant" }}</dd>
      </div>
      <div class="flex flex-col gap-3 bg-default p-5 sm:p-6">
        <dt class="eyebrow">Langages</dt>
        <dd class="flex flex-wrap gap-1.5">
          <span
            v-for="lang in languages"
            :key="lang"
            class="border border-accented px-2 py-1 font-mono text-xs text-toned"
          >
            {{ formatLanguage(lang) }}
          </span>
        </dd>
      </div>
    </dl>
  </div>
</template>
