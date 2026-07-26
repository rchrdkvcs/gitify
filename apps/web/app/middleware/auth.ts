export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const toast = useToast();

  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Veuillez vous connecter",
      description: "Vous devez vous connecter pour accéder à cette page.",
      icon: "i-heroicons-exclamation-circle-20-solid",
      color: "warning",
      ui: {
        root: "bg-dark border border-light/5",
      },
    });
    return navigateTo("/");
  }
});
