<script setup lang="ts">
import { Markdown } from "@comark/vue";

const props = withDefaults(
  defineProps<{
    source: string;
    ownerName: string;
    name: string;
    branch?: string | null;
    collapsible?: boolean;
  }>(),
  { branch: null, collapsible: false },
);

const expanded = ref(!props.collapsible);
const value = computed(() =>
  absolutizeMarkdown(props.source, {
    ownerName: props.ownerName,
    name: props.name,
    branch: props.branch,
  }),
);
</script>

<template>
  <div>
    <div
      class="relative"
      :class="
        !collapsible
          ? ''
          : expanded
            ? 'max-h-[40rem] overflow-y-auto overscroll-contain pe-3'
            : 'max-h-[24rem] overflow-hidden'
      "
    >
      <Suspense>
        <Markdown :value="value" class="readme-body" />
        <template #fallback>
          <div class="flex flex-col gap-3" aria-hidden="true">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
          </div>
        </template>
      </Suspense>
      <div
        v-if="!expanded"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-(--ui-bg) to-transparent"
        aria-hidden="true"
      />
    </div>
    <div v-if="collapsible" class="mt-4 flex justify-center">
      <UButton
        :label="expanded ? 'Réduire' : 'Afficher tout'"
        :icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
        color="neutral"
        variant="outline"
        size="sm"
        @click="expanded = !expanded"
      />
    </div>
  </div>
</template>
