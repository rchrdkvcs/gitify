<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "~/utilis/FetchWrapper";

/**
 * User interface reflecting the backend model JSON serialization.
 * AdonisJS Lucid serializes properties to snake_case by default.
 */
interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
}

const user = ref<User | null>(null);
const loading = ref<boolean>(true);

/**
 * Attempt to fetch the current user profile on component mount.
 * The HttpOnly cookie is automatically sent by the FetchWrapper.
 */
onMounted(async () => {
  try {
    const response = await api.get<{ user: User }>("/auth/me");
    user.value = response.user;
  } catch (error) {
    // Silently handle 401 errors (User is simply not logged in)
    user.value = null;
  } finally {
    loading.value = false;
  }
});

/**
 * Handle user logout by calling the backend and clearing local state.
 */
const logout = async () => {
  try {
    await api.post("/auth/logout");
    user.value = null;
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

console.log(user);
</script>

<template>
  <div
    class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8"
  >
    <h1 class="text-5xl font-bold mb-8 text-blue-400">GitMatch</h1>

    <!-- Loading State -->
    <div v-if="loading" class="text-xl animate-pulse">Loading session...</div>

    <!-- Authenticated State -->
    <div v-else-if="user" class="text-center">
      <!-- Support both snake_case and camelCase to prevent missing images -->
      <img
        :src="user.avatar_url || user.avatarUrl || ''"
        alt="Avatar"
        class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover"
      />
      <p class="text-2xl mb-6">
        Hello, <span class="font-bold">{{ user.name || user.email }}</span> ! 👋
      </p>

      <div
        class="bg-gray-800 p-6 rounded-lg mb-8 border border-green-500/30 shadow-lg shadow-green-500/10"
      >
        <h2 class="text-xl font-semibold text-green-400 mb-2">
          Secure Content 🔒
        </h2>
        <p class="text-gray-300">
          Authentication successful via AdonisJS Opaque Token.
        </p>
      </div>

      <button
        @click="logout"
        class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
      >
        Sign Out
      </button>
    </div>

    <!-- Unauthenticated State -->
    <div v-else>
      <a
        href="http://localhost:3333/auth/github/redirect"
        class="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition inline-flex items-center gap-2"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            fill-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clip-rule="evenodd"
          />
        </svg>
        Sign in with GitHub
      </a>
    </div>
  </div>
</template>
