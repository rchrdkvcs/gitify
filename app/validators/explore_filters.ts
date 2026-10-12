import type { ExploreFilters, ExploreSort, UserPreferences } from "#shared/types/index";
import { normalizePreferenceLanguages } from "#shared/preferences";

const sorts: ExploreSort[] = ["stars", "recent", "issues"];

/** Explicit query parameters win; a first visit falls back to the reader's preferences. */
export function parseExploreFilters(
  qs: Record<string, unknown>,
  preferences: UserPreferences | null,
): ExploreFilters {
  const explicit = ["q", "topic", "language", "level", "sort"].some((key) => key in qs);
  const raw = (value: unknown) => (Array.isArray(value) ? value.join(",") : String(value ?? ""));

  const languages = explicit
    ? normalizePreferenceLanguages(raw(qs.language).split(",").filter(Boolean))
    : normalizePreferenceLanguages(preferences?.languages ?? []);
  const level = explicit ? raw(qs.level) : (preferences?.difficulty ?? "all");
  const sort = raw(qs.sort) as ExploreSort;

  return {
    q: raw(qs.q).trim().slice(0, 100),
    topic: /^[a-z0-9][a-z0-9-]{0,49}$/.test(raw(qs.topic)) ? raw(qs.topic) : null,
    languages,
    level: level === "beginner" || level === "expert" ? level : "all",
    sort: sorts.includes(sort) ? sort : "stars",
  };
}
