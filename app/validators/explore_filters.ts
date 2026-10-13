import type { ExploreFilters, ExploreSort, UserPreferences } from "#shared/types/index";
import {
  difficultyForLevel,
  normalizePreferenceLanguages,
  topicPattern,
} from "#shared/preferences";

const sorts: ExploreSort[] = ["stars", "recent", "issues", "welcome"];

/** Explicit query parameters win; a first visit falls back to the reader's preferences. */
export function parseExploreFilters(
  qs: Record<string, unknown>,
  preferences: UserPreferences | null,
): ExploreFilters {
  const explicit = ["q", "topic", "language", "level", "sort", "score"].some((key) => key in qs);
  const raw = (value: unknown) => (Array.isArray(value) ? value.join(",") : String(value ?? ""));

  const languages = explicit
    ? normalizePreferenceLanguages(raw(qs.language).split(",").filter(Boolean))
    : normalizePreferenceLanguages(preferences?.languages ?? []);
  const level = explicit
    ? raw(qs.level)
    : preferences
      ? difficultyForLevel(preferences.level)
      : "all";
  // Someone looking for a first contribution starts with the most welcoming projects.
  const sort = (
    explicit ? raw(qs.sort) : preferences?.level === "first_contribution" ? "welcome" : "stars"
  ) as ExploreSort;
  const score = Number.parseInt(raw(qs.score), 10);

  return {
    q: raw(qs.q).trim().slice(0, 100),
    topic: topicPattern.test(raw(qs.topic)) ? raw(qs.topic) : null,
    languages,
    level: level === "beginner" || level === "expert" ? level : "all",
    sort: sorts.includes(sort) ? sort : "stars",
    minScore: Number.isInteger(score) && score > 0 && score <= 100 ? score : null,
  };
}
