import type { Data } from "@gitify/api/data";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<Data.User | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const isInitialized = ref(false);
  const config = useRuntimeConfig();
  const { $api } = useNuxtApp();

  async function login() {
    window.location.href = config.public.apiBaseUrl + $api.urlFor("auth.redirect");
  }

  async function logout() {
    await $api.api.auth.logout({});
    user.value = null;
  }

  return {
    user,
    isAuthenticated,
    isInitialized,
    login,
    logout,
  };
});
