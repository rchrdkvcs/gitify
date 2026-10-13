import { router, usePage } from "@inertiajs/vue3";
import { computed, reactive } from "vue";
import type { AuthUser } from "../../shared/types/index.js";

export function useAuth() {
  const page = usePage<{ user: AuthUser | null }>();
  return reactive({
    user: computed(() => page.props.user),
    isAuthenticated: computed(() => page.props.user !== null),
    authenticate: () => "/auth/github/redirect",
    logout: () => router.delete("/auth/logout"),
  });
}
