<script setup lang="ts">
const {user, loading, fetchMe, logout} = useAuth()
const {
  submitting,
  isEditingPreferences,
  formDifficulty,
  formLanguages,
  availableLanguages,
  toggleLanguage,
  editPreferences,
  savePreferences,
} = usePreferences(user)

onMounted(fetchMe)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
    <h1 class="mb-8 text-5xl font-bold text-blue-400">GitMatch</h1>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse text-xl">Loading session...</div>

    <!-- 1. Onboarding / Edit State (Logged in, but no preferences OR editing) -->
    <div
      v-else-if="user && (!user.preferences || isEditingPreferences)"
      class="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-xl"
    >
      <h2 class="mb-2 text-center text-3xl font-bold">
        {{
          isEditingPreferences
            ? "Modifier tes préférences ⚙️"
            : `Bienvenue, ${user.name || "Développeur"} ! 🚀`
        }}
      </h2>
      <p class="mb-8 text-center text-gray-400">
        Configurons ton profil pour te trouver les meilleurs projets open-source.
      </p>

      <div class="space-y-8">
        <!-- Difficulty Selection -->
        <div>
          <h3 class="mb-4 text-xl font-semibold">Quel est ton niveau actuel ?</h3>
          <div class="flex gap-4">
            <button
              @click="formDifficulty = 'beginner'"
              :class="
                formDifficulty === 'beginner'
                  ? 'border-blue-500 bg-blue-600'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              "
              class="flex-1 rounded-lg border py-4 font-medium transition"
            >
              🌱 Débutant (Good First Issues)
            </button>
            <button
              @click="formDifficulty = 'expert'"
              :class="
                formDifficulty === 'expert'
                  ? 'border-blue-500 bg-blue-600'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              "
              class="flex-1 rounded-lg border py-4 font-medium transition"
            >
              🔥 Expert (Défis complexes)
            </button>
          </div>
        </div>

        <!-- Languages Selection -->
        <div>
          <h3 class="mb-4 text-xl font-semibold">Quels langages pratiques-tu ?</h3>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="lang in availableLanguages"
              :key="lang"
              @click="toggleLanguage(lang)"
              :class="
                formLanguages.includes(lang)
                  ? 'border-green-500 bg-green-600'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              "
              class="rounded-full border px-4 py-2 text-sm font-medium capitalize transition"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex gap-4">
          <button
            v-if="isEditingPreferences"
            @click="isEditingPreferences = false"
            class="flex-1 rounded-lg bg-gray-600 py-4 font-bold text-white shadow-lg transition hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            @click="savePreferences"
            :disabled="submitting"
            class="flex-1 rounded-lg bg-blue-500 py-4 font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:opacity-50"
          >
            {{
              submitting
                ? "Enregistrement..."
                : isEditingPreferences
                  ? "Mettre à jour 🚀"
                  : "Commencer à swiper 🚀"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Dashboard / Ready to Swipe State (Logged in AND has preferences AND NOT editing) -->
    <div v-else-if="user && user.preferences && !isEditingPreferences" class="text-center">
      <!-- Support both snake_case and camelCase to prevent missing images -->
      <img
        :src="user.avatar_url || user.avatarUrl || ''"
        alt="Avatar"
        class="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-blue-500 object-cover"
      />
      <p class="mb-6 text-2xl">
        Hello, <span class="font-bold">{{ user.name || user.email }}</span> ! 👋
      </p>

      <div
        class="mb-8 rounded-lg border border-green-500/30 bg-gray-800 p-6 shadow-lg shadow-green-500/10"
      >
        <h2 class="mb-2 text-xl font-semibold text-green-400">Profil Complet ✅</h2>
        <p class="text-gray-300">
          Niveau :
          <span class="font-bold text-white capitalize">{{ user.preferences.difficulty }}</span>
        </p>
        <p class="text-gray-300">
          Langages :
          <span class="font-bold text-white capitalize">{{
              user.preferences.languages.join(", ")
            }}</span>
        </p>
      </div>
      <div class="flex justify-center gap-4 m-5">
        <NuxtLink to="/swipe"
                  class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700">
          Start to swipe
        </NuxtLink>
        <NuxtLink to="/liked"
                  class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700">
          Liked
        </NuxtLink>
      </div>
      <div class="flex justify-center gap-4">
        <button
          @click="editPreferences"
          class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          Modifier mes préférences
        </button>
        <button
          @click="logout"
          class="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>

    <!-- Unauthenticated State -->
    <div v-else>
      <a
        href="http://localhost:3333/auth/github/redirect"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
      >
        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
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
