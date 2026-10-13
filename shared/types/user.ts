import type {
  contributionTypeCatalog,
  experienceLevelCatalog,
  PreferenceLanguage,
} from "../preferences.js";

export type { PreferenceLanguage };

export type ExperienceLevel = (typeof experienceLevelCatalog)[number]["id"];

export type ContributionType = (typeof contributionTypeCatalog)[number]["id"];

export type UserPreferences = {
  level: ExperienceLevel;
  languages: PreferenceLanguage[];
  contributionTypes: ContributionType[];
  topics: string[];
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  preferences: UserPreferences | null;
  onboardedAt: string | null;
  onboardingSkippedAt: string | null;
  onboardingStep: number;
  createdAt: string | null;
  updatedAt: string | null;
};
