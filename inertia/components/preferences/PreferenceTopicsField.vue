<script setup lang="ts">
import { maxPreferenceTopics, topicPattern, topicSuggestions } from "@shared/preferences";

const props = defineProps<{ legend: string; selected: string[] }>();
const emit = defineEmits<{ toggle: [topic: string] }>();

const custom = ref("");
const error = ref<string | null>(null);

// Topics typed by the user stay visible next to the suggestions.
const options = computed(() => [...new Set([...topicSuggestions, ...props.selected])]);
const full = computed(() => props.selected.length >= maxPreferenceTopics);

function addCustom() {
  const topic = custom.value.trim().toLowerCase().replace(/\s+/g, "-");
  if (!topic) return;
  if (!topicPattern.test(topic)) {
    error.value = "Lettres minuscules, chiffres et tirets uniquement.";
    return;
  }
  if (!props.selected.includes(topic) && !full.value) emit("toggle", topic);
  custom.value = "";
  error.value = null;
}

const pillClass = (active: boolean) =>
  active
    ? "border-primary/60 bg-primary/10 text-highlighted"
    : "border-default text-muted hover:border-accented hover:text-highlighted";
</script>

<template>
  <fieldset class="flex flex-col gap-5">
    <legend class="sr-only">{{ legend }}</legend>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="topic in options"
        :key="topic"
        type="button"
        :aria-pressed="selected.includes(topic)"
        :disabled="full && !selected.includes(topic)"
        class="inline-flex cursor-pointer items-center gap-1.5 border px-3 py-2 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        :class="pillClass(selected.includes(topic))"
        @click="emit('toggle', topic)"
      >
        <UIcon
          :name="selected.includes(topic) ? 'lucide:check' : 'lucide:plus'"
          class="size-3.5"
          aria-hidden="true"
        />
        {{ topic }}
      </button>
    </div>

    <form class="flex max-w-sm flex-col gap-1.5" @submit.prevent="addCustom">
      <label for="custom-topic" class="text-sm text-muted">Un autre sujet GitHub ?</label>
      <div class="flex gap-2">
        <UInput
          id="custom-topic"
          v-model="custom"
          placeholder="ex. raspberry-pi"
          :disabled="full"
          class="flex-1"
          :aria-invalid="!!error"
          aria-describedby="custom-topic-hint"
        />
        <UButton type="submit" label="Ajouter" color="neutral" variant="outline" :disabled="full" />
      </div>
      <p
        id="custom-topic-hint"
        class="font-mono text-xs"
        :class="error ? 'text-error' : 'text-dimmed'"
      >
        {{ error ?? `${selected.length} / ${maxPreferenceTopics} sujets` }}
      </p>
    </form>
  </fieldset>
</template>
