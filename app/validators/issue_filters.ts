import type { IssueFilters, IssueKind, IssueSort, UserPreferences } from "#shared/types/index";
import { issueKindForDifficulty, issueKinds } from "#shared/issues";
import { difficultyForLevel, normalizePreferenceLanguages } from "#shared/preferences";

const sorts: IssueSort[] = ["recent", "comments", "stars"];

/** Same rule as the catalogue: explicit query parameters win, a first visit uses the reader's preferences. */
export function parseIssueFilters(
  qs: Record<string, unknown>,
  preferences: UserPreferences | null,
): IssueFilters {
  const explicit = ["q", "language", "label", "unassigned", "sort"].some((key) => key in qs);
  const raw = (value: unknown) => (Array.isArray(value) ? value.join(",") : String(value ?? ""));

  const languages = explicit
    ? normalizePreferenceLanguages(raw(qs.language).split(",").filter(Boolean))
    : normalizePreferenceLanguages(preferences?.languages ?? []);
  const kind = explicit
    ? raw(qs.label)
    : preferences
      ? issueKindForDifficulty(difficultyForLevel(preferences.level))
      : "all";
  const sort = raw(qs.sort) as IssueSort;

  return {
    q: raw(qs.q).trim().slice(0, 100),
    languages,
    kind: issueKinds.includes(kind as IssueKind) ? (kind as IssueKind) : "all",
    // Contributable issues by default; only an explicit opt-out shows assigned ones.
    unassigned: !["0", "false"].includes(raw(qs.unassigned)),
    sort: sorts.includes(sort) ? sort : "recent",
  };
}
