<script setup lang="ts">
defineProps<{
  items: any[];
  languages: string[];
}>();

defineEmits<{
  (e: "toggle", title: string): void;
}>();
</script>

<template>
  <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    <UCard
      v-for="item in items"
      :key="item.title"
      @click="$emit('toggle', item.title)"
      class="preferences-card block hover:bg-card/30! md:p-4"
      :class="{ 'preferences-card-active': languages.includes(item.title) }"
      :ui="{ body: 'items-center gap-6' }"
    >
      <UIcon
        v-if="languages.includes(item.title)"
        name="lets-icons:check-fill"
        class="check-icon"
      />
      <div
        class="container-icon size-12"
        :class="{ 'bg-primary/20': languages.includes(item.title) }"
      >
        <span
          class="font-jetbrains text-xl font-bold text-lightgray"
          :class="{ 'text-primary': languages.includes(item.title) }"
        >
          {{ item.label || item.title }}
        </span>
      </div>
      <p
        class="font-medium text-lightgray"
        :class="{ 'text-white': languages.includes(item.title) }"
      >
        {{ item.title }}
      </p>
    </UCard>
  </div>
</template>
