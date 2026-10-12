<script setup lang="ts">
import type { ProjectDetail, RepositoryInsights } from "@shared/types/index";

const props = defineProps<{
  project: ProjectDetail;
  insights: RepositoryInsights;
}>();

const weeks = computed(() => props.insights.weeklyCommits ?? []);
const yearTotal = computed(() => weeks.value.reduce((sum, count) => sum + count, 0));
const peak = computed(() => Math.max(1, ...weeks.value));
const activeWeeks = computed(() => weeks.value.filter((count) => count > 0).length);
const hovered = ref<number | null>(null);

const weekLabel = (index: number) => {
  const ago = weeks.value.length - 1 - index;
  return ago === 0 ? "Cette semaine" : ago === 1 ? "La semaine dernière" : `Il y a ${ago} semaines`;
};

const ratio = (part: number, whole: number) =>
  whole > 0 ? `${Math.floor((part / whole) * 100)} %` : "—";

const summary = computed(() => [
  { label: "Commits sur 12 mois", value: weeks.value.length ? formatNumber(yearTotal.value) : "—" },
  {
    label: "Semaines actives",
    value: weeks.value.length ? `${activeWeeks.value} / ${weeks.value.length}` : "—",
  },
  {
    label: "Issues résolues",
    value: ratio(
      props.insights.closedIssues,
      props.insights.closedIssues + props.insights.openIssues,
    ),
    hint: `${formatNumber(props.insights.closedIssues)} fermées · ${formatNumber(props.insights.openIssues)} ouvertes`,
  },
  {
    label: "PR fusionnées",
    value: formatNumber(props.insights.mergedPullRequests),
    hint: `${formatNumber(props.insights.openPullRequests)} en attente`,
  },
]);

const languageTotal = computed(() =>
  props.insights.languages.reduce((sum, language) => sum + language.bytes, 0),
);
const languages = computed(() =>
  props.insights.languages
    .map((language) => ({
      ...language,
      percent: languageTotal.value ? (language.bytes / languageTotal.value) * 100 : 0,
    }))
    .filter((language) => language.percent >= 0.1),
);
const formatPercent = (value: number) =>
  `${value.toLocaleString("fr-FR", { maximumFractionDigits: value < 10 ? 1 : 0 })} %`;
</script>

<template>
  <div class="flex flex-col">
    <dl class="grid grid-cols-2 gap-px border-b border-default bg-(--ui-border) lg:grid-cols-4">
      <div v-for="stat in summary" :key="stat.label" class="flex flex-col gap-1 bg-default p-5">
        <dt class="text-xs text-muted">{{ stat.label }}</dt>
        <dd class="font-mono text-xl text-highlighted tabular-nums">{{ stat.value }}</dd>
        <dd v-if="stat.hint" class="font-mono text-[11px] text-dimmed">{{ stat.hint }}</dd>
      </div>
    </dl>

    <section aria-labelledby="commits-title" class="border-b border-default px-4 py-6 sm:px-8">
      <div class="mb-5 flex items-baseline justify-between gap-4">
        <h3 id="commits-title" class="text-sm font-medium text-highlighted">Commits par semaine</h3>
        <p class="font-mono text-xs text-muted tabular-nums" aria-live="polite">
          <template v-if="hovered !== null">
            {{ weekLabel(hovered) }} · {{ weeks[hovered] }} commit{{
              weeks[hovered] === 1 ? "" : "s"
            }}
          </template>
          <template v-else-if="weeks.length">Pic : {{ peak }} commits</template>
        </p>
      </div>

      <template v-if="weeks.length">
        <div
          class="flex h-36 items-end gap-0.5 border-b border-accented"
          role="img"
          :aria-label="`${yearTotal} commits sur les 52 dernières semaines, pic à ${peak} commits par semaine`"
          @mouseleave="hovered = null"
        >
          <div
            v-for="(count, index) in weeks"
            :key="index"
            class="flex h-full flex-1 items-end"
            @mouseenter="hovered = index"
          >
            <div
              class="w-full transition-colors"
              :class="hovered === index ? 'bg-primary' : count ? 'bg-primary/60' : 'bg-accented'"
              :style="{ height: count ? `${Math.max(3, (count / peak) * 100)}%` : '1px' }"
            />
          </div>
        </div>
        <div class="mt-2 flex justify-between font-mono text-[11px] text-dimmed">
          <span>Il y a 12 mois</span>
          <span>Aujourd’hui</span>
        </div>
        <table class="sr-only">
          <caption>
            Commits par semaine
          </caption>
          <tbody>
            <tr v-for="(count, index) in weeks" :key="index">
              <th scope="row">{{ weekLabel(index) }}</th>
              <td>{{ count }}</td>
            </tr>
          </tbody>
        </table>
      </template>
      <p v-else class="text-sm text-muted">
        GitHub calcule encore l’historique de ce dépôt. Il apparaîtra à la prochaine actualisation.
      </p>
    </section>

    <section v-if="languages.length" aria-labelledby="languages-title" class="px-4 py-6 sm:px-8">
      <h3 id="languages-title" class="mb-5 text-sm font-medium text-highlighted">
        Répartition du code
      </h3>
      <div class="flex h-2 gap-0.5 overflow-hidden" aria-hidden="true">
        <div
          v-for="language in languages"
          :key="language.name"
          :style="{
            width: `${language.percent}%`,
            backgroundColor: language.color ?? 'var(--ui-text-dimmed)',
          }"
        />
      </div>
      <ul class="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="language in languages"
          :key="language.name"
          class="flex items-center gap-2 text-sm"
        >
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: language.color ?? 'var(--ui-text-dimmed)' }"
            aria-hidden="true"
          />
          <span class="text-toned">{{ language.name }}</span>
          <span class="ms-auto font-mono text-xs text-muted tabular-nums">
            {{ formatPercent(language.percent) }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
