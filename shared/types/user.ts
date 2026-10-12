/** Where the user stands in their open source journey. */
export type ExperienceLevel = "first_contribution" | "some_contributions" | "experienced";

/** Kinds of help the user wants to give; non-coders are first-class contributors. */
export type ContributionType =
  | "code"
  | "documentation"
  | "tests"
  | "translation"
  | "design"
  | "triage";

/**
 * Stored search preferences. Empty lists mean "no preference" (every language,
 * every contribution type, no topic). Read them through `normalizeUserPreferences`
 * from `shared/preferences.ts` when the source may hold the legacy shape.
 */
export type UserPreferences = {
  level: ExperienceLevel;
  languages: string[];
  contributionTypes: ContributionType[];
  topics: string[];
};
