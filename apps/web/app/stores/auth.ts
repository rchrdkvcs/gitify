import type { Data } from "@gitify/api/data";

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();

  const user = ref<Data.User | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  const me = async () => {
    const headers = useRequestHeaders(["cookie"]);

    const { data } = await $fetch<any>(config.public.apiBaseUrl + "/auth/me", {
      credentials: "include",
      headers,
    });

    if (data) {
      user.value = data;
    }
  };

  const authenticate = () => {
    return `${config.public.apiBaseUrl}/auth/github/redirect`;
  };

  const logout = async () => {
    const headers = useRequestHeaders(["cookie"]);

    await $fetch(config.public.apiBaseUrl + "/auth/logout", {
      method: "DELETE",
      credentials: "include",
      headers,
    });

    user.value = null;
  };

  return {
    user,
    isAuthenticated,
    me,
    authenticate,
    logout,
  };
});
