export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const { $api } = useNuxtApp();

  if (authStore.user) return;

  try {
    const headers = useRequestHeaders(["cookie"]);

    const user = await $api.api.auth.me({
      credentials: "include",
      headers: import.meta.server ? headers : undefined,
    });

    if (user) {
      authStore.user = user.data;
    }
  } catch {
    console.debug("No active session found");
  } finally {
    authStore.isInitialized = true;
  }
});
