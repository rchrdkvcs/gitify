<script setup lang="ts">
import type { FeedRefreshState } from "@shared/types/index";

export interface FeedStatusCopy {
  degraded: string;
  refreshing: string;
  unavailable: { title: string; description: string };
  preparing: { icon: string; title: string; description: string };
}

defineProps<{
  refreshState: FeedRefreshState;
  hasItems: boolean;
  copy: FeedStatusCopy;
}>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <template v-if="hasItems">
    <p
      v-if="refreshState === 'degraded' || refreshState === 'refreshing'"
      role="status"
      class="border-b border-default px-4 py-3 text-sm text-muted sm:px-5"
    >
      {{ refreshState === "degraded" ? copy.degraded : copy.refreshing }}
    </p>
    <slot />
  </template>

  <EmptyState
    v-else-if="refreshState === 'unavailable'"
    icon="lucide:wifi-off"
    :title="copy.unavailable.title"
    :description="copy.unavailable.description"
  >
    <UButton label="Réessayer" color="neutral" variant="outline" @click="$emit('retry')" />
  </EmptyState>

  <EmptyState
    v-else-if="refreshState === 'refreshing'"
    :icon="copy.preparing.icon"
    :title="copy.preparing.title"
    :description="copy.preparing.description"
  />

  <slot v-else name="empty" />
</template>
