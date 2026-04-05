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
  const { http } = useHttp();
  const user = ref<User | null>(null);
  const loading = ref(false);

  async function fetchMe() {
    loading.value = true;
    try {
      const response = await http<{ user: User }>("/auth/me");
      user.value = response.user;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await http("/auth/logout", { method: "POST" });
      user.value = null;
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  return { user, loading, fetchMe, logout };
}
