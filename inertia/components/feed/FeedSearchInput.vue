<script setup lang="ts">
const query = defineModel<string>({ required: true });

const input = useTemplateRef<{ inputRef: HTMLInputElement | null }>("input");
defineShortcuts({ "/": () => input.value?.inputRef?.focus() });
</script>

<template>
  <UInput ref="input" v-model="query" icon="lucide:search" type="search">
    <template #trailing>
      <UButton
        v-if="query"
        icon="lucide:x"
        aria-label="Effacer la recherche"
        color="neutral"
        variant="link"
        size="sm"
        @click="query = ''"
      />
      <UKbd v-else value="/" />
    </template>
  </UInput>
</template>
