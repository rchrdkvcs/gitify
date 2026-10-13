<script setup lang="ts">
import { Head } from "@inertiajs/vue3";
import { summarizePreferences } from "@shared/preference_summary";

const authStore = useAuth();
const user = computed(() => authStore.user);
const summary = computed(() =>
  user.value?.preferences ? summarizePreferences(user.value.preferences) : null,
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

      <div v-if="summary" class="flex flex-col">
        <dl class="grid gap-px bg-(--ui-border) sm:grid-cols-2">
          <div class="flex flex-col gap-2 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Niveau</dt>
            <dd class="text-lg text-highlighted">{{ summary.level?.title }}</dd>
            <dd class="text-sm text-muted">{{ summary.level?.description }}</dd>
          </div>
          <div class="flex flex-col gap-3 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Contributions</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span
                v-for="label in summary.contributionTypes.values"
                :key="label"
                class="border border-accented px-2 py-1 font-mono text-xs text-toned"
              >
                {{ label }}
              </span>
              <span v-if="!summary.contributionTypes.values.length" class="text-sm text-muted">
                {{ summary.contributionTypes.text }}
              </span>
            </dd>
          </div>
          <div class="flex flex-col gap-3 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Langages</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span
                v-for="language in summary.languages.values"
                :key="language"
                class="border border-accented px-2 py-1 font-mono text-xs text-toned"
              >
                {{ language }}
              </span>
              <span v-if="!summary.languages.values.length" class="text-sm text-muted">
                {{ summary.languages.text }}
              </span>
            </dd>
          </div>
          <div class="flex flex-col gap-3 bg-default p-5 sm:p-8">
            <dt class="eyebrow">Centres d’intérêt</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span
                v-for="topic in summary.topics.values"
                :key="topic"
                class="border border-default px-2 py-1 font-mono text-xs text-muted"
              >
                {{ topic }}
              </span>
              <span v-if="!summary.topics.values.length" class="text-sm text-muted">
                {{ summary.topics.text }}
              </span>
            </dd>
          </div>
        </dl>
        <div class="flex flex-wrap gap-3 border-t border-default p-5 sm:px-8">
          <UButton
            to="/preferences"
            icon="lucide:sliders-horizontal"
            label="Modifier mes préférences"
            color="neutral"
            variant="outline"
          />
          <UButton
            v-if="!user?.onboardedAt"
            to="/onboarding"
            label="Terminer le parcours guidé"
            trailing-icon="lucide:arrow-right"
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-start gap-4 p-5 sm:p-8">
        <div class="flex items-start gap-3">
          <UIcon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0 text-toned" />
          <div>
            <p class="font-medium text-highlighted">Préférences à compléter</p>
            <p class="mt-1 text-sm text-muted">
              Quatre questions pour régler ton fil : ton niveau, ta façon de contribuer, tes
              langages et tes centres d’intérêt.
            </p>
          </div>
        </div>
        <UButton
          to="/onboarding"
          label="Commencer le parcours"
          trailing-icon="lucide:arrow-right"
        />
      </div>
    </div>
  </FrameSection>
</template>
