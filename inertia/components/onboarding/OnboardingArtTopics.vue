<script setup lang="ts">
import { topicSuggestions } from "@shared/preferences";

// The user at the centre, linked to topics; chosen links draw in with the accent.
const props = defineProps<{ selected: string[] }>();

const positions = [
  { x: 56, y: 36 },
  { x: 160, y: 22 },
  { x: 264, y: 36 },
  { x: 56, y: 144 },
  { x: 160, y: 158 },
  { x: 264, y: 144 },
];

const topics = computed(() => {
  const ordered = [...new Set([...props.selected, ...topicSuggestions])].slice(0, 6);
  return ordered.map((topic, index) => {
    const label = topic.length > 12 ? `${topic.slice(0, 11)}…` : topic;
    const width = label.length * 6.2 + 16;
    return {
      topic,
      label,
      width,
      active: props.selected.includes(topic),
      ...positions[index]!,
    };
  });
});
</script>

<template>
  <svg viewBox="0 0 320 180" class="ill h-auto w-full" aria-hidden="true">
    <g v-for="item in topics" :key="`line-${item.topic}-${item.active}`">
      <line
        x1="160"
        y1="90"
        :x2="item.x"
        :y2="item.y"
        stroke-width="1.5"
        :class="item.active ? 'ill-accent ill-draw' : 'ill-faint'"
        style="--ill-length: 130"
      />
    </g>
    <g v-for="item in topics" :key="item.topic">
      <rect
        :x="item.x - item.width / 2 + 0.5"
        :y="item.y - 10.5"
        :width="item.width"
        height="21"
        class="ill-shift"
        :class="item.active ? 'ill-accent ill-accent-soft' : 'ill-line ill-fill'"
      />
      <text
        :x="item.x"
        :y="item.y + 3.5"
        text-anchor="middle"
        font-size="10"
        :class="item.active ? 'ill-text-strong' : 'ill-text'"
      >
        {{ item.label }}
      </text>
    </g>
    <rect
      x="144.5"
      y="78.5"
      width="31"
      height="23"
      class="ill-accent ill-fill"
      stroke-width="1.5"
    />
    <text x="160" y="94" text-anchor="middle" font-size="10" class="ill-text-strong">toi</text>
  </svg>
</template>
