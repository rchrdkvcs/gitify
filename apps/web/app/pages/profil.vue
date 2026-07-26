<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const hasPreferences = computed(() => !!user.value?.preferences);
const visibleLanguages = computed(() => user.value?.preferences?.languages?.slice(0, 2) || []);
const hiddenLanguages = computed(() => user.value?.preferences?.languages?.slice(2) || []);

const handleLogout = async () => {
  await authStore.logout();
  navigateTo("/");
};

const profileStatus = computed(() => {
  return hasPreferences.value
    ? {
        wrapper: "bg-green-500/5 border-green-500",
        iconBg: "bg-green-500/10 border-green-500/30",
        icon: "lets-icons:check-fill",
        textColor: "text-green-500",
        subTextColor: "text-green-500/80",
        title: "Profil Complet",
        description: "Vos préférences de recherche sont configurées.",
      }
    : {
        wrapper: "bg-yellow-500/5 border-yellow-500",
        iconBg: "bg-yellow-500/10 border-yellow-500/30",
        icon: "carbon:warning-filled",
        textColor: "text-yellow-500",
        subTextColor: "text-yellow-500/80",
        title: "Profil Incomplet",
        description: "Veuillez renseigner vos critères de recherche.",
      };
});
</script>
<template>
  <div class="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-20">
    <section class="my-5 flex flex-col items-center gap-6 md:my-12 md:flex-row md:justify-between">
      <div class="flex flex-col items-center md:flex md:flex-row md:gap-6">
        <UUser
          :ui="{ avatar: 'size-40 border border-secondary/20', root: 'w-min' }"
          :avatar="{ src: user?.avatarUrl, alt: user?.name }"
        />
        <div class="mt-3 flex flex-col items-center gap-3 md:items-start md:justify-center">
          <span class="font-jetbrains text-sm text-lightgreen uppercase">Connecté en tant que</span>
          <div class="flex items-center justify-center gap-2">
            <UIcon class="size-6 md:size-9" name="ix:user-profile" />
            <p class="font-jetbrains text-2xl md:text-3xl">{{ user?.name }}</p>
          </div>
          <p class="text-md text-lightgray">{{ user?.email }}</p>
        </div>
      </div>

      <div class="mt-8 flex w-full flex-wrap justify-center gap-3 md:mt-0 md:w-auto md:flex-col">
        <UButton
          icon="lucide:log-out"
          label="Se déconnecter"
          color="brand"
          @click="handleLogout"
          class="w-auto"
        />
        <UButton
          v-if="hasPreferences"
          icon="mdi:pencil"
          label="Éditer le profil"
          color="secondary"
          variant="ghost"
          to="/preferences"
          class="w-auto"
          block
        />
      </div>
    </section>

    <USeparator />

    <section
      class="my-5 flex flex-col items-center gap-6 rounded-md border p-6 md:my-12 md:flex-row md:justify-between"
      :class="profileStatus.wrapper"
    >
      <div class="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-4">
        <div
          class="flex size-12 items-center justify-center rounded-full border"
          :class="profileStatus.iconBg"
        >
          <UIcon class="size-6" :name="profileStatus.icon" :class="profileStatus.textColor" />
        </div>

        <div class="flex flex-1 flex-col gap-1 text-center md:text-left">
          <h3 class="font-grotesk text-xl font-bold md:text-2xl" :class="profileStatus.textColor">
            {{ profileStatus.title }}
          </h3>
          <p :class="profileStatus.subTextColor">
            {{ profileStatus.description }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2">
        <template v-if="hasPreferences">
          <UBadge color="secondary">
            <UIcon name="material-symbols:check" class="size-4 text-green-500" />
            Niveau: {{ user?.preferences?.difficulty }}
          </UBadge>

          <UBadge v-for="lang in visibleLanguages" :key="lang" color="secondary">
            <UIcon name="material-symbols:check" class="size-4 text-green-500" />
            {{ lang }}
          </UBadge>

          <UTooltip arrow v-if="hiddenLanguages.length > 0" :text="hiddenLanguages.join(', ')">
            <UBadge color="secondary">
              <UIcon name="material-symbols:check" class="size-4 text-green-500" />
              +{{ hiddenLanguages.length }}
            </UBadge>
          </UTooltip>
        </template>

        <UButton
          v-else
          icon="mdi:pencil"
          label="Éditer le profil"
          color="yellow"
          to="/preferences"
          class="w-auto"
        />
      </div>
    </section>
  </div>
</template>
