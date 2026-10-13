<template>
  <p
    role="status"
    class="flex items-center gap-2 border-b border-default px-4 py-3 text-sm text-muted sm:px-8"
  >
    <UIcon
      name="lucide:loader-circle"
      class="size-4 shrink-0 motion-safe:animate-spin"
      aria-hidden="true"
    />
    Récupération des détails du dépôt depuis GitHub…
  </p>
  <div class="flex flex-col gap-8 px-4 py-8 sm:px-8" aria-hidden="true">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <USkeleton v-for="tile in 4" :key="tile" class="h-16" />
    </div>
    <div class="flex flex-col gap-3">
      <USkeleton class="h-6 w-1/3" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
      <USkeleton class="h-4 w-2/3" />
    </div>
  </div>
</template>
