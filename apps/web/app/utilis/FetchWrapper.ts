/**
 * FetchWrapper
 * A custom HTTP client built on top of the native Fetch API.
 * Handles base URL configuration, default headers, and credentials inclusion (HTTP-Only cookies).
 */
export class FetchWrapper {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Core request method handling the actual fetch call and error management.
   *
   * @param endpoint - The API endpoint to call.
   * @param options - Fetch options (method, headers, body, etc.).
   * @returns A promise resolving to the parsed generic type T.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
      // Crucial for AdonisJS Session/Opaque Token Auth via Cookies
      credentials: "include",
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || response.statusText);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  async get<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "GET" });
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, { method: "POST", body: JSON.stringify(data) });
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, { method: "PUT", body: JSON.stringify(data) });
  }

  async delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

// Global instance configured for the local AdonisJS backend
export const api = new FetchWrapper("http://localhost:3333");
