<script setup lang="ts">
const props = defineProps<{ options: string[]; preferred?: string[] }>();
const topic = defineModel<string | null>({ required: true });

const isPreferred = (item: string) => props.preferred?.includes(item) ?? false;

function toggle(item: string) {
  topic.value = topic.value === item ? null : item;
}

const chipClass = (active: boolean) =>
  active
    ? "border-primary/60 bg-primary/10 text-highlighted"
    : "border-default text-muted hover:border-accented hover:text-highlighted";
</script>

<template>
  <div v-if="options.length" class="flex flex-wrap items-center gap-1.5">
    <span class="me-1 font-mono text-xs text-dimmed">Sujets populaires</span>
    <button
      v-for="item in options"
      :key="item"
      type="button"
      :aria-pressed="topic === item"
      class="cursor-pointer border px-2 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary"
      :class="chipClass(topic === item)"
      @click="toggle(item)"
    >
      <span
        v-if="isPreferred(item)"
        class="me-1 inline-block size-1 bg-primary align-middle"
        aria-hidden="true"
      />
      {{ item }}
      <span v-if="isPreferred(item)" class="sr-only">(tes centres d’intérêt)</span>
    </button>
  </div>
</template>
