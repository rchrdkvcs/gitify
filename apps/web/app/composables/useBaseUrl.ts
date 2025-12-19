export const useBaseUrl = (endpoint: string) => {
  const baseUrl = import.meta.env.VITE_API_URL;
  return `${baseUrl}${endpoint}`;
};
