import type { Data } from "@generated/data";
import { router, usePage } from "@inertiajs/vue3";
import { computed, reactive } from "vue";

export function useAuth() {
  const page = usePage<{ user: Data.User | null }>();
  return reactive({
    user: computed(() => page.props.user),
    isAuthenticated: computed(() => page.props.user !== null),
    authenticate: () => "/auth/github/redirect",
    logout: () => router.delete("/auth/logout"),
  });
}
