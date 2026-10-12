<template>
  <UCard>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <USkeleton class="h-12 w-12 shrink-0 rounded-md" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <USkeleton class="h-5 w-3/4" />
          <USkeleton class="h-3 w-1/3" />
        </div>
      </div>
      <USkeleton class="h-6 w-16 shrink-0 rounded-full" />
    </div>

    <div class="mb-6 flex flex-col gap-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-2/3" />
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <USkeleton class="h-6 w-20 rounded-sm" />
      <USkeleton class="h-6 w-16 rounded-sm" />
      <USkeleton class="h-6 w-28 rounded-sm" />
    </div>

    <div class="mt-auto flex items-center justify-between pt-4">
      <USkeleton class="h-4 w-16" />
      <div class="flex gap-4">
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-4 w-24" />
      </div>
    </div>
  </UCard>
</template>
