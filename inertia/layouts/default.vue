<script setup lang="ts">
import { usePage } from "@inertiajs/vue3";

const page = usePage();
const toast = useToast();

function showFlashedError() {
  const error: unknown = page.flash?.error;
  if (typeof error === "string") {
    toast.add({ title: error, icon: "lucide:triangle-alert", color: "error" });
  }
}

onMounted(showFlashedError);
watch(() => page.flash, showFlashedError);
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only z-50 bg-primary px-3 py-2 font-mono text-sm text-inverted focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Aller au contenu
    </a>
    <AppHeader />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
