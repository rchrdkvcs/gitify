<script setup lang="ts">
const props = defineProps<{
  repositoryUrl: string;
}>();

const cloneCommand = computed(() => `git clone ${props.repositoryUrl}.git`);

const copied = ref(false);
async function copyCloneCommand() {
  await navigator.clipboard.writeText(cloneCommand.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2
      class="flex items-center gap-2 font-grotesk text-sm font-bold tracking-widest text-lightgreen/40 uppercase"
    >
      <UIcon name="lucide:book-open" class="size-4" />
      Getting Started
    </h2>
    <div class="rounded-lg border border-secondary bg-card/20 p-5">
      <p class="pb-3 font-grotesk font-bold text-white">Cloner le repository</p>
      <div
        class="flex items-center justify-between gap-3 rounded-lg bg-dark px-4 py-3 ring-1 ring-white/5"
      >
        <code class="truncate font-jetbrains text-sm text-lightgreen">{{ cloneCommand }}</code>
        <UTooltip :text="copied ? 'Copié !' : 'Copier la commande'">
          <UButton
            :icon="copied ? 'lucide:check' : 'lucide:copy'"
            color="neutral"
            variant="ghost"
            size="sm"
            class="shrink-0"
            @click="copyCloneCommand"
          />
        </UTooltip>
      </div>
    </div>
  </section>
</template>
