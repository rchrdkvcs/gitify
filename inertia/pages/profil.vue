<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

const authStore = useAuth();
const user = computed(() => authStore.user);
const preferences = computed(() => user.value?.preferences ?? null);

const levelLabel = computed(() => {
  if (!preferences.value) return null;
  return preferences.value.difficulty === "expert" ? "Confirmé" : "Débutant";
});

const levelHint = computed(() =>
  preferences.value?.difficulty === "expert"
    ? "Projets populaires qui cherchent de l’aide (help wanted)."
    : "Projets avec des issues pensées pour débuter (good first issue).",
);
</script>

<template>
  <Head title="Profil" />

  <PageHeader
    eyebrow="Profil"
    :title="user?.name ?? 'Mon profil'"
    :description="user?.email ?? undefined"
  >
    <template #leading>
      <UAvatar
        :src="user?.avatarUrl ?? undefined"
        alt=""
        class="mb-3 size-16 border border-default text-2xl"
      />
    </template>
    <template #actions>
      <UButton
        icon="lucide:log-out"
        label="Se déconnecter"
        color="neutral"
        variant="ghost"
        @click="authStore.logout()"
      />
    </template>
  </PageHeader>

  <FrameSection>
    <div class="grid lg:grid-cols-[16rem_1fr]">
      <div class="border-b border-default p-5 sm:p-8 lg:border-e lg:border-b-0">
        <h2 class="font-medium text-highlighted">Préférences</h2>
        <p class="mt-2 text-sm leading-relaxed text-muted">
          Elles décident des projets proposés dans ton fil.
        </p>
      </div>

      <div v-if="preferences" class="flex flex-col">
        <dl class="grid gap-px bg-(--ui-border) sm:grid-cols-2">
          <div class="flex flex-col gap-2 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Niveau</dt>
            <dd class="text-lg text-highlighted">{{ levelLabel }}</dd>
            <dd class="text-sm text-muted">{{ levelHint }}</dd>
          </div>
          <div class="flex flex-col gap-3 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Langages</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span
                v-for="lang in preferences.languages"
                :key="lang"
                class="border border-accented px-2 py-1 font-mono text-xs text-toned"
              >
                {{ formatLanguage(lang) }}
              </span>
            </dd>
          </div>
        </dl>
        <div class="border-t border-default p-5 sm:px-8">
          <UButton
            to="/preferences"
            icon="lucide:sliders-horizontal"
            label="Modifier mes préférences"
            color="neutral"
            variant="outline"
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-start gap-4 p-5 sm:p-8">
        <div class="flex items-start gap-3">
          <UIcon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0 text-toned" />
          <div>
            <p class="font-medium text-highlighted">Préférences à compléter</p>
            <p class="mt-1 text-sm text-muted">
              Indique ton niveau et tes langages pour débloquer ton fil de projets.
            </p>
          </div>
        </div>
        <UButton
          to="/preferences"
          label="Compléter mes préférences"
          trailing-icon="lucide:arrow-right"
        />
      </div>
    </div>
  </FrameSection>
</template>
