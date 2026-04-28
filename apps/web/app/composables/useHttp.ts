export function useHttp() {
  const config = useRuntimeConfig();

  async function http<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    return $fetch<T>(url, {
      baseURL: config.public.apiBaseUrl,
      credentials: "include",
      ...options,
    });
  }

  return { http };
}
