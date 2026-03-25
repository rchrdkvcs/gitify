export const useApi = createUseFetch((currentOptions) => {
  const runtimeConfig = useRuntimeConfig();

  return {
    ...currentOptions,
    baseURL: runtimeConfig.public.apiBaseUrl,
  };
});
