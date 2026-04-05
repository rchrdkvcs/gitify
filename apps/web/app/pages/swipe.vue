<script setup lang="ts">
const { projects, currentProject, remaining, loading, error, actionLoading, fetchFeed, swipe } =
  useSwipe();

onMounted(fetchFeed);
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
    <h1 class="mb-8 text-3xl font-bold text-blue-400">GitMatch</h1>

    <!-- Loading initial -->
    <div v-if="loading && projects.length === 0" class="animate-pulse text-xl text-gray-400">
      Chargement des projets...
    </div>

    <!-- Erreur -->
    <div v-else-if="error" class="text-center text-red-400">
      <p>{{ error }}</p>
      <button
        @click="fetchFeed"
        class="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700"
      >
        Réessayer
      </button>
    </div>

    <!-- Feed vide -->
    <div v-else-if="!currentProject" class="text-center text-gray-400">
      <p class="text-xl">Plus aucun projet disponible pour le moment.</p>
      <p class="mt-2 text-sm">Reviens dans 24h pour de nouveaux projets !</p>
    </div>

    <!-- Carte projet -->
    <div v-else class="w-full max-w-xl">
      <div class="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
        <!-- Header : nom + owner -->
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold text-white">{{ currentProject.name }}</h2>
            <p class="text-sm text-gray-400">by {{ currentProject.ownerName }}</p>
          </div>
          <a
            :href="currentProject.repositoryUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg border border-gray-600 p-2 transition hover:border-blue-500 hover:text-blue-400"
            title="Voir sur GitHub"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fill-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
        </div>

        <!-- Language + Stars + Issues -->
        <div class="mb-4 flex flex-wrap gap-3">
          <span
            v-if="currentProject.language"
            class="rounded-full bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-300"
          >
            {{ currentProject.language }}
          </span>
          <span class="rounded-full bg-yellow-900/50 px-3 py-1 text-sm font-medium text-yellow-300">
            ⭐ {{ currentProject.stars.toLocaleString() }}
          </span>
          <span class="rounded-full bg-green-900/50 px-3 py-1 text-sm font-medium text-green-300">
            🐛 {{ currentProject.openIssuesCount }} issues
          </span>
        </div>

        <!-- Description -->
        <p class="mb-4 leading-relaxed text-gray-300">
          {{ currentProject.description ?? "Aucune description disponible." }}
        </p>

        <!-- Topics -->
        <div v-if="currentProject.topics?.length" class="mb-6 flex flex-wrap gap-2">
          <span
            v-for="topic in currentProject.topics.slice(0, 6)"
            :key="topic"
            class="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-400"
          >
            {{ topic }}
          </span>
        </div>

        <!-- Boutons Like / Pass -->
        <div class="flex gap-4">
          <button
            @click="swipe('pass')"
            :disabled="actionLoading"
            class="flex-1 rounded-xl border-2 border-red-500/50 bg-red-900/20 py-4 text-xl font-bold text-red-400 transition hover:border-red-500 hover:bg-red-900/40 disabled:opacity-50"
          >
            ✕ Pass
          </button>
          <button
            @click="swipe('like')"
            :disabled="actionLoading"
            class="flex-1 rounded-xl border-2 border-green-500/50 bg-green-900/20 py-4 text-xl font-bold text-green-400 transition hover:border-green-500 hover:bg-green-900/40 disabled:opacity-50"
          >
            ♥ Like
          </button>
        </div>
      </div>

      <!-- Compteur -->
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ remaining }} projet(s) restant(s) dans la file
      </p>
    </div>
    <div class="m-5 flex justify-center gap-4">
      <NuxtLink
        to="/"
        class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Go home
      </NuxtLink>
      <NuxtLink
        to="/liked"
        class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Liked
      </NuxtLink>
    </div>
  </div>
</template>
