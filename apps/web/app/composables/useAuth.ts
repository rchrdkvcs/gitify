import { useApi } from "~/composables/useApi";

export interface UserPreferences {
  difficulty: "beginner" | "expert";
  languages: string[];
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  preferences: UserPreferences | null;
}

export function useAuth() {
  const user = ref<User | null>(null);

  async function login(provider: string) {
    const { data } = await useApi<User>(`/auth/${provider}`);
    user.value = data.value ?? null;

    return user.value;
  }

  async function logout() {
    await useApi("/auth/logout", { method: "POST" });
    user.value = null;
  }

  async function fetchUser() {
    if (user.value) return user.value;

    const { data } = await useApi<User>("/auth/me");
    user.value = data.value ?? null;

    return data.value ?? null;
  }

  return { user, login, logout, fetchMe: fetchUser };
}
