<script setup lang="ts"></script>

<template>
  <UFooter>
    <template #left>
      <AppLogo />
    </template>

    <UNavigationMenu
      :items="[
        { label: 'Explore', to: '/explore' },
        { label: 'Community', to: '/community' },
        { label: 'Ressources', to: '/ressources' },
      ]"
    />

    <template #right>
      <UButton label="Twitter" color="neutral" variant="ghost" />
      <UButton label="Discord" color="neutral" variant="ghost" />
    </template>
  </UFooter>
</template>
