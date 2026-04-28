import type { Data } from "@gitify/api/data";

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  if (authStore.user) return;

  try {
    const headers = useRequestHeaders(["cookie"]);

    const user = await $fetch<Data.User | null>(`${useRuntimeConfig().public.apiBaseUrl}/auth/me`, {
      credentials: "include",
      headers: import.meta.server ? headers : undefined,
    });

    if (user) {
      authStore.user = user;
    }
  } catch {
    console.debug("No active session found");
  } finally {
    authStore.isInitialized = true;
  }
});
