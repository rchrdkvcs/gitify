<template>
  <div class="flex h-full flex-col gap-5 bg-default p-5 sm:p-6" aria-hidden="true">
    <div class="flex items-start gap-3">
      <USkeleton class="size-10 shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-3 w-1/3" />
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <USkeleton class="h-3.5 w-full" />
      <USkeleton class="h-3.5 w-2/3" />
    </div>
    <div class="flex gap-1.5">
      <USkeleton class="h-5 w-16" />
      <USkeleton class="h-5 w-20" />
    </div>
    <div class="mt-auto flex gap-4 border-t border-default pt-4">
      <USkeleton class="h-3.5 w-20" />
      <USkeleton class="h-3.5 w-12" />
    </div>
  </div>
</template>
