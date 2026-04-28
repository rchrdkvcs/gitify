<script setup lang="ts">
interface ShowcaseContributor {
  login: string;
  avatarUrl: string;
  profileUrl: string;
}

interface ShowcaseProject {
  id: number;
  name: string;
  ownerName: string;
  repositoryUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  latestRelease: string | null;
  updatedAt: string;
  topics: string[];
  totalContributorsCount: number | null;
  contributors: ShowcaseContributor[];
}

interface ShowcaseLanguage {
  language: string;
  projects: ShowcaseProject[];
}

const authStore = useAuthStore();
const { user, isInitialized } = storeToRefs(authStore);
const { login, logout } = authStore;

// loading = true while the auth init plugin hasn't finished yet
const loading = computed(() => !isInitialized.value);

const {
  submitting,
  isEditingPreferences,
  formDifficulty,
  formLanguages,
  availableLanguages,
  toggleLanguage,
  editPreferences,
  savePreferences,
} = usePreferences();

const config = useRuntimeConfig();
const { data: showcaseData, pending: showcaseLoading } = useAsyncData<{
  languages: ShowcaseLanguage[];
}>("projects-showcase", () => $fetch(`${config.public.apiBaseUrl}/projects/showcase`), {
  server: false,
  lazy: true,
});

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <div class="animate-pulse text-xl">Loading session...</div>
    </div>

    <!-- 1. Onboarding / Edit Preferences -->
    <div
      v-else-if="user && (!user.preferences || isEditingPreferences)"
      class="flex min-h-screen items-center justify-center p-8"
    >
      <div class="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-xl">
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
    </div>

    <!-- 2. Dashboard -->
    <div
      v-else-if="user && user.preferences && !isEditingPreferences"
      class="flex min-h-screen flex-col items-center justify-center p-8 text-center"
    >
      <img
        :src="user.avatarUrl || ''"
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

      <div class="mb-4 flex justify-center gap-4">
        <NuxtLink
          to="/swipe"
          class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          Start to swipe
        </NuxtLink>
        <NuxtLink
          to="/liked"
          class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
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

    <!-- 3. Landing Page (Unauthenticated) -->
    <div v-else>
      <!-- Hero -->
      <div class="flex flex-col items-center px-8 pt-24 pb-16 text-center">
        <h1 class="mb-4 text-5xl font-bold text-blue-400">GitMatch</h1>
        <p class="mb-3 max-w-xl text-2xl font-semibold">
          Discover open-source projects you'll love
        </p>
        <p class="mb-10 max-w-lg text-gray-400">
          Swipe through GitHub repos matched to your stack. Like the ones that inspire you.
        </p>
        <a
          :href="`${config.public.apiBaseUrl}/auth/github/redirect`"
          class="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-gray-900 shadow-lg transition hover:bg-gray-100"
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

      <!-- Showcase rows -->
      <div class="pb-24">
        <!-- Skeleton while loading -->
        <div v-if="showcaseLoading" class="space-y-12 px-8">
          <div v-for="i in 3" :key="i">
            <div class="mb-4 h-6 w-32 animate-pulse rounded bg-gray-700" />
            <div class="flex gap-4">
              <div
                v-for="j in 3"
                :key="j"
                class="h-52 w-72 flex-shrink-0 animate-pulse rounded-xl bg-gray-800"
              />
            </div>
          </div>
        </div>

        <!-- Language rows -->
        <div v-else-if="showcaseData?.languages?.length" class="space-y-12">
          <div v-for="row in showcaseData.languages" :key="row.language">
            <!-- Row header -->
            <div class="mb-4 flex items-center gap-3 px-8">
              <h2 class="text-xl font-bold capitalize">{{ row.language }}</h2>
              <span class="text-sm text-gray-500">{{ row.projects.length }} projects</span>
            </div>

            <!-- Horizontal scroll -->
            <div class="flex gap-4 overflow-x-auto px-8 pb-2" style="scrollbar-width: none">
              <div
                v-for="project in row.projects"
                :key="project.id"
                class="flex w-72 flex-shrink-0 flex-col justify-between rounded-xl border border-gray-700 bg-gray-800 p-5 transition hover:border-gray-500"
              >
                <!-- Top: name + github link -->
                <div>
                  <div class="mb-1 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="truncate font-bold text-white">{{ project.name }}</p>
                      <p class="text-xs text-gray-500">by {{ project.ownerName }}</p>
                    </div>
                    <a
                      :href="project.repositoryUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-shrink-0 text-gray-500 transition hover:text-white"
                    >
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          fill-rule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>

                  <!-- Badges -->
                  <div class="my-3 flex flex-wrap gap-1.5">
                    <span
                      class="rounded-full bg-blue-900/50 px-2 py-0.5 text-xs font-medium text-blue-300 capitalize"
                    >
                      {{ project.language }}
                    </span>
                    <span
                      class="rounded-full bg-yellow-900/50 px-2 py-0.5 text-xs font-medium text-yellow-300"
                    >
                      ⭐ {{ formatStars(project.stars) }}
                    </span>
                    <span
                      v-if="project.latestRelease"
                      class="rounded-full bg-purple-900/50 px-2 py-0.5 text-xs font-medium text-purple-300"
                    >
                      {{ project.latestRelease }}
                    </span>
                    <span class="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                      {{ formatDate(project.updatedAt) }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="line-clamp-2 text-sm leading-relaxed text-gray-400">
                    {{ project.description ?? "No description available." }}
                  </p>

                  <!-- Topics -->
                  <div v-if="project.topics?.length" class="mt-3 flex gap-1.5">
                    <span
                      v-for="topic in project.topics"
                      :key="topic"
                      class="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-500"
                    >
                      {{ topic }}
                    </span>
                  </div>
                </div>

                <!-- Bottom: contributors -->
                <div class="mt-4 flex items-center gap-2">
                  <div class="flex -space-x-2">
                    <img
                      v-for="contributor in project.contributors"
                      :key="contributor.login"
                      :src="contributor.avatarUrl"
                      :alt="contributor.login"
                      :title="contributor.login"
                      class="h-6 w-6 rounded-full border-2 border-gray-800 object-cover"
                    />
                  </div>
                  <span v-if="project.totalContributorsCount" class="text-xs text-gray-500">
                    +{{ project.totalContributorsCount.toLocaleString() }} contributors
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="border-t border-gray-800 py-16 text-center">
        <p class="mb-6 text-lg text-gray-400">Ready to find your next open-source adventure?</p>
        <a
          :href="`${config.public.apiBaseUrl}/auth/github/redirect`"
          class="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700"
        >
          Get started — it's free
        </a>
      </div>
    </div>
  </div>
</template>
