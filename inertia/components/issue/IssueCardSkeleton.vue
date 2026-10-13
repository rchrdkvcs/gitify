<template>
  <div class="flex h-full flex-col gap-4 bg-default p-5 sm:p-6" aria-hidden="true">
    <div class="flex items-center gap-2.5">
      <USkeleton class="size-6 shrink-0" />
      <USkeleton class="h-3 w-1/2" />
    </div>
    <div class="flex flex-col gap-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-2/3" />
    </div>
    <div class="flex gap-1.5">
      <USkeleton class="h-5 w-24" />
      <USkeleton class="h-5 w-20" />
    </div>
    <div class="mt-auto flex flex-col gap-2 border-t border-default pt-4">
      <USkeleton class="h-3.5 w-full" />
      <USkeleton class="h-3.5 w-full" />
    </div>
  </div>
</template>
