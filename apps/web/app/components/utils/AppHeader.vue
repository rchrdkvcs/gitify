<script setup lang="ts">
const authStore = useAuthStore();

const navigationItems = ref([
  { label: "Explore", to: "/explore" },
  { label: "Community", to: "/community" },
  { label: "Ressources", to: "/ressources" },
]);
</script>

<template>
  <UHeader>
    <template #left>
      <ULink to="/">
        <AppLogo />
      </ULink>
    </template>

    <UNavigationMenu :items="navigationItems" />

    <template #body>
      <UNavigationMenu :items="navigationItems" />
    </template>

    <template #right>
      <UButton
        v-if="!authStore.isAuthenticated"
        icon="lucide:log-in"
        label="Se connecter"
        :to="authStore.authenticate()"
      />

      <UUser
        v-else
        :name="authStore.user?.name!"
        :description="authStore.user?.email!"
        :avatar="{
          src: authStore.user?.avatarUrl!,
          alt: authStore.user?.name!,
        }"
      />
    </template>
  </UHeader>
</template>
