<script setup lang="ts" generic="Item extends { id: string | number }">
import { InfiniteScroll } from "@inertiajs/vue3";

defineProps<{ data: string; items: Item[] }>();
defineSlots<{
  item(props: { item: Item }): unknown;
  skeleton(): unknown;
}>();
</script>

<template>
  <InfiniteScroll :data="data" :buffer="600">
    <ProjectGrid>
      <ProjectGridItem v-for="item in items" :key="item.id">
        <slot name="item" :item="item" />
      </ProjectGridItem>
    </ProjectGrid>
    <template #loading>
      <ProjectGrid>
        <ProjectGridItem v-for="n in 3" :key="n">
          <slot name="skeleton" />
        </ProjectGridItem>
      </ProjectGrid>
    </template>
  </InfiniteScroll>
</template>
