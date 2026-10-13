import type { UserPreferences } from "./types/user.js";
import {
  contributionTypeCatalog,
  experienceLevelCatalog,
  formatLanguageName,
} from "./preferences.js";

export interface PreferenceChoices {
  values: string[];
  text: string;
}

export interface PreferenceSummary {
  level: { title: string; description: string } | null;
  contributionTypes: PreferenceChoices;
  languages: PreferenceChoices;
  topics: PreferenceChoices;
}

function choices(values: string[], whenEmpty: string): PreferenceChoices {
  return { values, text: values.length ? values.join(", ") : whenEmpty };
}

export function summarizePreferences(preferences: UserPreferences): PreferenceSummary {
  const level = experienceLevelCatalog.find((item) => item.id === preferences.level);
  return {
    level: level ? { title: level.title, description: level.description } : null,
    contributionTypes: choices(
      contributionTypeCatalog
        .filter((item) => preferences.contributionTypes.includes(item.id))
        .map((item) => item.title),
      "Toutes",
    ),
    languages: choices(preferences.languages.map(formatLanguageName), "Tous"),
    topics: choices(preferences.topics, "Aucun"),
  };
}
