export const useApi = createUseFetch((callerOptions) => {
  const runtimeConfig = useRuntimeConfig();

  return {
    ...callerOptions,
    baseURL: runtimeConfig.public.apiBaseUrl,
    credentials: "include",
  };
});
