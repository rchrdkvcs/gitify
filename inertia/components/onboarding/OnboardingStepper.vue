<script setup lang="ts">
const props = defineProps<{
  steps: readonly { label: string }[];
  current: number;
  reached: number;
}>();
const emit = defineEmits<{ select: [step: number] }>();

const state = (step: number) =>
  step === props.current ? "current" : step <= props.reached ? "done" : "upcoming";
</script>

<template>
  <nav aria-label="Progression">
    <ol class="flex">
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        class="flex min-w-0 items-center border-default not-last:border-e"
        :class="index + 1 === current ? 'flex-1' : 'max-md:flex-none md:flex-1'"
      >
        <button
          type="button"
          class="group flex w-full min-w-0 items-center gap-3 px-3 py-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary enabled:cursor-pointer enabled:hover:bg-muted sm:px-5"
          :disabled="state(index + 1) === 'upcoming' || index + 1 === current"
          :aria-current="index + 1 === current ? 'step' : undefined"
          @click="emit('select', index + 1)"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center border font-mono text-xs tabular-nums transition-colors duration-200"
            :class="{
              'border-primary bg-primary text-inverted': state(index + 1) === 'done',
              'border-primary text-primary': state(index + 1) === 'current',
              'border-accented text-dimmed': state(index + 1) === 'upcoming',
            }"
          >
            <UIcon
              v-if="state(index + 1) === 'done'"
              name="lucide:check"
              class="size-3.5"
              aria-hidden="true"
            />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span
            class="truncate text-sm"
            :class="[
              index + 1 === current ? 'text-highlighted' : 'text-muted',
              index + 1 === current ? '' : 'max-md:sr-only',
            ]"
          >
            {{ step.label }}
            <span v-if="state(index + 1) === 'done'" class="sr-only"> (terminée)</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>
