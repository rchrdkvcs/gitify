interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  body?: unknown;
}

export function useHttp() {
  async function http<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const token = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
      ?.slice("XSRF-TOKEN=".length);
    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
  return { http };
}
