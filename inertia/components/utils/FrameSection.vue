<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: string;
    innerClass?: string;
    bordered?: boolean;
  }>(),
  { as: "section", innerClass: "", bordered: true },
);
</script>

<template>
  <component :is="as" class="overflow-x-clip" :class="bordered ? 'border-b border-default' : ''">
    <div
      class="relative mx-auto w-full max-w-(--ui-container) sm:border-x sm:border-default"
      :class="innerClass"
    >
      <slot />
    </div>
  </component>
</template>
