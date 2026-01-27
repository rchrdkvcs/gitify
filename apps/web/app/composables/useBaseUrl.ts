export const useBaseUrl = (endpoint: string) => {
  const baseUrl = useRuntimeConfig().public.apiBaseUrl;

  return `${baseUrl}${endpoint}`;
};
