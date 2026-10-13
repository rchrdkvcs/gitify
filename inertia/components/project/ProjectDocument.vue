<script setup lang="ts">
defineProps<{
  headingId: string;
  heading: string;
  icon: string;
  source: string | null;
  ownerName: string;
  name: string;
  branch: string | null | undefined;
}>();
</script>

<template>
  <section :aria-labelledby="headingId">
    <h2
      :id="headingId"
      class="flex items-center gap-2 border-b border-default px-4 py-3 font-mono text-xs tracking-wider text-muted uppercase sm:px-8"
    >
      <UIcon :name="icon" class="size-4" aria-hidden="true" />
      {{ heading }}
    </h2>
    <div class="px-4 py-8 sm:px-8">
      <ProjectMarkdown
        v-if="source"
        :source="source"
        :owner-name="ownerName"
        :name="name"
        :branch="branch"
        collapsible
      />
      <slot v-else />
    </div>
  </section>
</template>
