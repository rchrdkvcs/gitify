<script setup lang="ts">
defineProps<{ options: { value: string; label: string; icon: string }[] }>();
const languages = defineModel<string[]>({ required: true });

function toggleLanguage(value: string) {
  languages.value = languages.value.includes(value)
    ? languages.value.filter((language) => language !== value)
    : [...languages.value, value];
}

const tabClass = (active: boolean) =>
  active ? "bg-muted text-highlighted" : "text-muted hover:bg-muted/50 hover:text-highlighted";
</script>

<template>
  <div
    class="no-scrollbar flex overflow-x-auto border-b border-default"
    role="group"
    aria-label="Filtrer par langage"
  >
    <button
      type="button"
      :aria-pressed="languages.length === 0"
      class="relative shrink-0 cursor-pointer border-e border-default px-4 py-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      :class="tabClass(languages.length === 0)"
      @click="languages = []"
    >
      Tous les langages
      <span
        v-if="languages.length === 0"
        class="absolute inset-x-0 bottom-0 h-px bg-primary"
        aria-hidden="true"
      />
    </button>
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      :aria-pressed="languages.includes(item.value)"
      class="relative shrink-0 cursor-pointer border-e border-default px-4 py-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      :class="tabClass(languages.includes(item.value))"
      @click="toggleLanguage(item.value)"
    >
      <span class="inline-flex items-center gap-2">
        <UIcon
          :name="item.icon"
          class="size-4 transition-opacity"
          :class="languages.includes(item.value) ? 'opacity-100' : 'opacity-60'"
          aria-hidden="true"
        />
        {{ item.label }}
      </span>
      <span
        v-if="languages.includes(item.value)"
        class="absolute inset-x-0 bottom-0 h-px bg-primary"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
