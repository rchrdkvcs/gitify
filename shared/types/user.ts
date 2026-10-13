export type ExperienceLevel = "first_contribution" | "some_contributions" | "experienced";

export type ContributionType =
  | "code"
  | "documentation"
  | "tests"
  | "translation"
  | "design"
  | "triage";

export type UserPreferences = {
  level: ExperienceLevel;
  languages: string[];
  contributionTypes: ContributionType[];
  topics: string[];
};
