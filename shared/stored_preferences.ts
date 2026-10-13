import type { ContributionType, ExperienceLevel, UserPreferences } from "./types/user.js";
import {
  contributionTypes,
  experienceLevels,
  levelForDifficulty,
  maxPreferenceTopics,
  normalizePreferenceLanguages,
  topicPattern,
} from "./preferences.js";

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeUserPreferences(raw: unknown): UserPreferences | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const value = raw as Record<string, unknown>;
  const level = experienceLevels.includes(value.level as ExperienceLevel)
    ? (value.level as ExperienceLevel)
    : levelForDifficulty(value.difficulty);
  const legacy = !("level" in value) && "difficulty" in value;
  const types = stringList(value.contributionTypes).filter((type): type is ContributionType =>
    contributionTypes.includes(type as ContributionType),
  );

  return {
    level,
    languages: normalizePreferenceLanguages(stringList(value.languages)),
    contributionTypes: legacy && types.length === 0 ? ["code"] : [...new Set(types)],
    topics: [
      ...new Set(
        stringList(value.topics)
          .map((topic) => topic.trim().toLowerCase())
          .filter((topic) => topicPattern.test(topic)),
      ),
    ].slice(0, maxPreferenceTopics),
  };
}
