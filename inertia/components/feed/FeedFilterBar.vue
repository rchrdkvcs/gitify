<script setup lang="ts">
defineProps<{
  languageOptions: { value: string; label: string; icon: string }[];
  resultLabel: string;
  canReset: boolean;
}>();
const languages = defineModel<string[]>("languages", { required: true });
defineEmits<{ reset: [] }>();
</script>

<template>
  <FrameSection class="sticky top-(--ui-header-height) z-20 bg-default/90 backdrop-blur">
    <LanguageFilterTabs v-model="languages" :options="languageOptions" />

    <div class="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
      <slot />

      <UButton
        v-if="canReset"
        label="Réinitialiser"
        color="neutral"
        variant="link"
        size="sm"
        class="text-muted"
        @click="$emit('reset')"
      />

      <p class="ms-auto font-mono text-xs whitespace-nowrap text-muted" role="status">
        {{ resultLabel }}
      </p>
      <slot name="trailing" />
    </div>
  </FrameSection>
</template>
