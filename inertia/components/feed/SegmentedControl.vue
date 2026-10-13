<script setup lang="ts" generic="Value extends string">
defineProps<{
  label: string;
  items: { label: string; value: Value; mono?: boolean }[];
}>();
const selected = defineModel<Value>({ required: true });
</script>

<template>
  <div class="flex border border-default" role="group" :aria-label="label">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :aria-pressed="selected === item.value"
      class="cursor-pointer border-e border-default px-3 py-1.5 text-xs transition-colors last:border-e-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      :class="[
        selected === item.value
          ? 'bg-elevated text-highlighted'
          : 'text-muted hover:text-highlighted',
        { 'font-mono': item.mono },
      ]"
      @click="selected = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>
