<script setup lang="ts">
const props = defineProps<{ value: string; label?: string }>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

async function copy() {
  await navigator.clipboard.writeText(props.value);
  copied.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <button
    type="button"
    class="relative flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted transition-[color,scale] duration-150 hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.96]"
    :aria-label="label ?? 'Copier la commande'"
    @click="copy"
  >
    <UIcon name="lucide:copy" class="copy-icon size-4" :data-visible="!copied" aria-hidden="true" />
    <UIcon
      name="lucide:check"
      class="copy-icon absolute size-4 text-primary"
      :data-visible="copied"
      aria-hidden="true"
    />
    <span class="sr-only" role="status">{{ copied ? "Copié" : "" }}</span>
  </button>
</template>

<style scoped>
.copy-icon {
  transition-property: opacity, scale, filter;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

.copy-icon[data-visible="false"] {
  opacity: 0;
  scale: 0.25;
  filter: blur(4px);
}

@media (prefers-reduced-motion: reduce) {
  .copy-icon {
    transition-property: opacity;
  }

  .copy-icon[data-visible="false"] {
    scale: 1;
    filter: none;
  }
}
</style>
