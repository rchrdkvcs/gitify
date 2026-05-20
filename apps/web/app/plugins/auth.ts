export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  if (authStore.user) return;

  try {
    await authStore.me();
  } catch {
    // Ignore errors, user will be null if not authenticated
  }
});
