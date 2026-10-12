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
