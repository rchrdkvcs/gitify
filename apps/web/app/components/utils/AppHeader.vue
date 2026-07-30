<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const authStore = useAuthStore();
const isLoading = ref(false);

const navigationItems = ref([
  { label: "Explorer", to: "/explore" },
  { label: "Communauté", to: "/community" },
  { label: "Ressources", to: "/ressources" },
]);

const handleLogin = () => {
  isLoading.value = true;
  window.location.href = authStore.authenticate();
};

const handleLogout = async () => {
  await authStore.logout();
};

const dropdownItems = [
  [
    {
      label: "Profil",
      icon: "ix:user-profile-filled",
      to: "/profil",
    },
    {
      label: "Mes favoris",
      icon: "tabler:heart-filled",
      to: "/favorites",
    },
    {
      label: "Déconnexion",
      color: "error",
      icon: "lucide:log-out",
      onSelect: handleLogout,
    },
  ],
] satisfies DropdownMenuItem[][];
</script>

<template>
  <UHeader class="border-b border-border bg-canvas">
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
        color="brand"
        :loading="isLoading"
        @click="handleLogin"
      />

      <UDropdownMenu v-else arrow :items="dropdownItems" class="cursor-pointer">
        <UUser
          :avatar="{
            src: authStore.user?.avatarUrl!,
            alt: authStore.user?.name!,
          }"
        />
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
