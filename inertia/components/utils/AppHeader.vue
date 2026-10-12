<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const authStore = useAuth();
const isLoading = ref(false);

const navigationItems: NavigationMenuItem[] = [
  { label: "Explorer", to: "/explore" },
  { label: "Favoris", to: "/favorites" },
  { label: "Communauté", to: "/community" },
  { label: "Ressources", to: "/ressources" },
];

const handleLogin = () => {
  isLoading.value = true;
  window.location.href = authStore.authenticate();
};

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: authStore.user?.name ?? "Mon compte",
    },
  ],
  [
    { label: "Profil", icon: "lucide:user", to: "/profil" },
    { label: "Favoris", icon: "lucide:heart", to: "/favorites" },
    { label: "Préférences", icon: "lucide:sliders-horizontal", to: "/preferences" },
  ],
  [
    {
      label: "Se déconnecter",
      icon: "lucide:log-out",
      onSelect: () => authStore.logout(),
    },
  ],
]);
</script>

<template>
  <UHeader
    :ui="{
      container: 'sm:border-x sm:border-default',
      center: 'lg:flex',
    }"
  >
    <template #left>
      <ULink to="/" aria-label="Gitify, accueil" class="text-highlighted">
        <AppLogo class="h-6 w-auto" />
      </ULink>
    </template>

    <UNavigationMenu
      :items="navigationItems"
      :ui="{ link: 'text-sm px-3 py-1.5', linkLabel: 'font-normal' }"
    />

    <template #body>
      <UNavigationMenu :items="navigationItems" orientation="vertical" class="-mx-2.5" />
    </template>

    <template #right>
      <UButton
        v-if="!authStore.isAuthenticated"
        icon="lucide:github"
        label="Se connecter"
        color="neutral"
        size="md"
        :loading="isLoading"
        @click="handleLogin"
      />

      <UDropdownMenu
        v-else
        :items="dropdownItems"
        :content="{ align: 'end' }"
        :ui="{ content: 'w-56' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          class="gap-2 px-1.5"
          :aria-label="`Menu du compte ${authStore.user?.name ?? ''}`"
          trailing-icon="lucide:chevron-down"
        >
          <UAvatar :src="authStore.user?.avatarUrl ?? undefined" alt="" size="xs" />
        </UButton>
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
