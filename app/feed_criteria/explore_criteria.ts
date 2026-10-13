import type { ExploreFilters, ExploreSort } from "#shared/types/index";
import {
  difficultyForLevel,
  normalizePreferenceLanguages,
  topicPattern,
} from "#shared/preferences";
import { defineFeedCriteria, languageList, oneOf, searchText } from "./feed_criteria.js";

const exploreSorts: ExploreSort[] = ["stars", "recent", "issues", "welcome"];
const exploreLevels: ExploreFilters["level"][] = ["all", "beginner", "expert"];

function minimumScore(raw: string): number | null {
  const score = Number.parseInt(raw, 10);
  return Number.isInteger(score) && score > 0 && score <= 100 ? score : null;
}

export const parseExploreFilters = defineFeedCriteria<ExploreFilters>({
  q: { param: "q", parse: searchText },
  topic: { param: "topic", parse: (raw) => (topicPattern.test(raw) ? raw : null) },
  languages: {
    param: "language",
    parse: languageList,
    fromPreferences: (preferences) => normalizePreferenceLanguages(preferences.languages),
  },
  level: {
    param: "level",
    parse: oneOf(exploreLevels, "all"),
    fromPreferences: (preferences) => difficultyForLevel(preferences.level),
  },
  sort: {
    param: "sort",
    parse: oneOf(exploreSorts, "stars"),
    fromPreferences: (preferences) =>
      preferences.level === "first_contribution" ? "welcome" : "stars",
  },
  minScore: { param: "score", parse: minimumScore },
});
