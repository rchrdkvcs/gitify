<script setup lang="ts">
import type { NewcomerScore, NewcomerSignalKey } from "@shared/types/index";
import {
  newcomerScoreRules,
  newcomerScoreWeights,
  newcomerSignalCatalog,
} from "@shared/newcomer_score";

// Explains every signal of the newcomer score: what was measured and what it earned.
const props = defineProps<{ score: NewcomerScore | null }>();

const rules = newcomerScoreRules;
const ruleText: Record<NewcomerSignalKey, string> = {
  firstResponse: `Tous les points sous ${rules.firstResponseHours.ideal} h, aucun au-delà de ${rules.firstResponseHours.worst / 24} jours.`,
  externalMergeRate: `Tous les points à partir de ${rules.externalMergeRate.full * 100} % ; il faut au moins ${rules.externalMergeRate.minimumDecided} PR tranchées.`,
  goodFirstIssues: `Tous les points à partir de ${rules.goodFirstIssues.full} issues libres.`,
  communityProfile:
    "CONTRIBUTING 40 %, modèles d’issue 25 %, code de conduite 20 %, modèle de PR 15 %.",
  maintainerActivity: `Tous les points sous ${rules.maintainerActivityDays.ideal} jours, aucun au-delà d’un an.`,
};

const rows = computed(() =>
  (Object.keys(newcomerScoreWeights) as NewcomerSignalKey[]).map((key) => {
    const signal = props.score?.signals.find((item) => item.key === key);
    const catalog = newcomerSignalCatalog[key];
    return {
      key,
      label: catalog.label,
      description: catalog.description,
      rule: ruleText[key],
      weight: newcomerScoreWeights[key],
      measured:
        signal?.value != null ? catalog.format(signal.value) : "Donnée indisponible sur GitHub",
      points: signal?.points ?? null,
      ratio: signal?.ratio ?? null,
    };
  }),
);
</script>

<template>
  <section
    id="newcomer-breakdown"
    aria-labelledby="newcomer-breakdown-title"
    class="scroll-mt-32 border-b border-default px-4 py-8 sm:px-8"
  >
    <h2 id="newcomer-breakdown-title" class="text-lg font-medium text-highlighted">
      Pourquoi ce score d’accueil ?
    </h2>
    <p class="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
      Cinq signaux tirés de GitHub, pondérés sur 100. Un signal inconnu n’abaisse pas le score : il
      est calculé sur les autres et marqué comme estimation.
      <template v-if="score?.computedAt"> Calculé {{ timeSince(score.computedAt) }}. </template>
    </p>

    <ul class="mt-6 flex flex-col divide-y divide-(--ui-border) border-y border-default">
      <li
        v-for="row in rows"
        :key="row.key"
        class="grid gap-3 py-4 sm:grid-cols-[1fr_9rem] sm:items-center"
      >
        <div class="flex flex-col gap-1">
          <p class="font-medium text-highlighted">{{ row.label }}</p>
          <p class="text-sm leading-relaxed text-muted">{{ row.description }}</p>
          <p class="font-mono text-xs text-dimmed">{{ row.rule }}</p>
        </div>
        <div class="flex flex-col gap-1.5 sm:items-end">
          <p class="text-sm" :class="row.points === null ? 'text-dimmed' : 'text-toned'">
            {{ row.measured }}
          </p>
          <p class="font-mono text-xs text-highlighted tabular-nums">
            <template v-if="row.points !== null">
              {{ row.points }} <span class="text-dimmed">/ {{ row.weight }} pts</span>
            </template>
            <span v-else class="text-dimmed">— / {{ row.weight }} pts</span>
          </p>
          <span class="block h-1 w-full bg-accented sm:w-28" aria-hidden="true">
            <span
              class="block h-full bg-primary"
              :style="{ width: `${(row.ratio ?? 0) * 100}%` }"
            />
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
