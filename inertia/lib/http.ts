interface HttpRequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  body?: unknown;
}

function xsrfToken(): string | undefined {
  const cookies = (globalThis as { document?: { cookie: string } }).document?.cookie ?? "";
  return cookies
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);
}

export async function http<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const token = xsrfToken();
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
