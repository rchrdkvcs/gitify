export const useHealthStore = defineStore("health", () => {
  const health = ref(null);

  const setHealth = (value: any) => {
    health.value = value;
  };

  return { health, setHealth };
});
