<script setup lang="ts">
import type { NewcomerScore } from "@shared/types/index";
import { newcomerScoreTier, newcomerSignalCatalog } from "@shared/newcomer_score";

// Sidebar summary of the newcomer score, with one bar per signal.
const props = defineProps<{ score: NewcomerScore | null }>();
const emit = defineEmits<{ explain: [] }>();

const tier = computed(() =>
  props.score?.score != null ? newcomerScoreTier(props.score.score) : null,
);
</script>

<template>
  <section aria-labelledby="newcomer-title" class="border-b border-default p-5">
    <h2 id="newcomer-title" class="eyebrow mb-4">Accueil des débutants</h2>

    <template v-if="score?.score != null">
      <p class="flex items-baseline gap-2">
        <span class="font-mono text-3xl text-highlighted tabular-nums">
          <span v-if="score.partial" aria-hidden="true">≈</span>{{ score.score }}
        </span>
        <span class="font-mono text-xs text-dimmed">/ 100</span>
        <span class="ms-auto text-sm text-toned">
          {{ score.archived ? "Dépôt archivé" : tier?.label }}
        </span>
      </p>
      <NewcomerScoreMeter :score="score.score" size="md" class="mt-3" />
      <p v-if="score.partial" class="mt-3 text-xs leading-relaxed text-muted">
        Estimation sur {{ Math.round(score.coverage * 100) }} % des signaux : certaines données
        GitHub manquent.
      </p>
      <p v-else-if="score.archived" class="mt-3 text-xs leading-relaxed text-muted">
        Un dépôt archivé n’accepte plus de contributions.
      </p>

      <dl class="mt-5 flex flex-col gap-2.5 text-sm">
        <div v-for="signal in score.signals" :key="signal.key" class="flex flex-col gap-1">
          <div class="flex items-baseline gap-2">
            <dt class="text-muted">{{ newcomerSignalCatalog[signal.key].label }}</dt>
            <dd class="ms-auto font-mono text-xs text-highlighted tabular-nums">
              <template v-if="signal.points !== null">
                {{ Math.round(signal.points) }}<span class="text-dimmed">/{{ signal.weight }}</span>
              </template>
              <span v-else class="text-dimmed">inconnu</span>
            </dd>
          </div>
          <span class="block h-1 bg-accented" aria-hidden="true">
            <span
              class="block h-full bg-primary"
              :style="{ width: `${(signal.ratio ?? 0) * 100}%` }"
            />
          </span>
        </div>
      </dl>
    </template>

    <p v-else class="text-sm leading-relaxed text-muted">
      {{
        score
          ? "Pas assez de données GitHub pour évaluer ce projet pour l’instant."
          : "Pas encore évalué : le score sera calculé à la prochaine actualisation du projet."
      }}
    </p>

    <UButton
      label="Pourquoi ce score ?"
      trailing-icon="lucide:arrow-right"
      color="neutral"
      variant="link"
      size="sm"
      class="mt-4 px-0"
      @click="emit('explain')"
    />
  </section>
</template>
