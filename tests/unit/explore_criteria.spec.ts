import { test } from "@japa/runner";
import type { UserPreferences } from "#shared/types/index";
import { parseExploreFilters } from "#feed_criteria/explore_criteria";

const preferences: UserPreferences = {
  level: "first_contribution",
  languages: ["rust"],
  contributionTypes: [],
  topics: [],
};

const unfiltered = {
  q: "",
  topic: null,
  languages: [],
  level: "all",
  sort: "stars",
  minScore: null,
};

test.group("Explore criteria", () => {
  test("a reader's preferences set languages, level and sort", ({ assert }) => {
    assert.deepEqual(parseExploreFilters({}, preferences), {
      ...unfiltered,
      languages: ["rust"],
      level: "beginner",
      sort: "welcome",
    });
    assert.deepEqual(parseExploreFilters({}, { ...preferences, level: "experienced" }), {
      ...unfiltered,
      languages: ["rust"],
      level: "expert",
    });
    assert.deepEqual(parseExploreFilters({}, null), unfiltered);
  });

  test("explicit parameters override only their own dimension", ({ assert }) => {
    assert.deepEqual(parseExploreFilters({ sort: "recent", level: "all" }, preferences), {
      ...unfiltered,
      languages: ["rust"],
      sort: "recent",
    });
  });

  test("invalid values fall back to an unfiltered dimension", ({ assert }) => {
    assert.deepEqual(
      parseExploreFilters(
        { q: " cli ", topic: "Not A Topic", level: "guru", sort: "random", score: "120" },
        null,
      ),
      { ...unfiltered, q: "cli" },
    );
    assert.deepEqual(parseExploreFilters({ topic: "react", score: "60" }, null), {
      ...unfiltered,
      topic: "react",
      minScore: 60,
    });
  });
});
