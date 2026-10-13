import { test } from "@japa/runner";
import type { UserPreferences } from "#shared/types/index";
import { defineFeedCriteria, languageList, oneOf, searchText } from "#feed_criteria/feed_criteria";

const preferences: UserPreferences = {
  level: "experienced",
  languages: ["rust"],
  contributionTypes: [],
  topics: [],
};

const parseCriteria = defineFeedCriteria<{ q: string; languages: string[]; sort: string }>({
  q: { param: "q", parse: searchText },
  languages: {
    param: "language",
    parse: languageList,
    fromPreferences: (reader) => [...reader.languages],
  },
  sort: {
    param: "sort",
    parse: oneOf(["new", "old"], "new"),
    fromPreferences: () => "old",
  },
});

test.group("Feed criteria", () => {
  test("each dimension falls back to preferences unless its own parameter is present", ({
    assert,
  }) => {
    assert.deepEqual(parseCriteria({}, preferences), { q: "", languages: ["rust"], sort: "old" });
    assert.deepEqual(parseCriteria({ sort: "new" }, preferences), {
      q: "",
      languages: ["rust"],
      sort: "new",
    });
    assert.deepEqual(parseCriteria({ language: "go", q: "cli" }, preferences), {
      q: "cli",
      languages: ["go"],
      sort: "old",
    });
  });

  test("an empty parameter explicitly clears its dimension", ({ assert }) => {
    assert.deepEqual(parseCriteria({ language: "" }, preferences).languages, []);
  });

  test("without preferences every dimension parses an absent value", ({ assert }) => {
    assert.deepEqual(parseCriteria({}, null), { q: "", languages: [], sort: "new" });
  });

  test("normalises values and rejects unknown options", ({ assert }) => {
    assert.deepEqual(
      parseCriteria({ q: `  ${"x".repeat(300)}`, language: ["GO,unknown", "go"], sort: "x" }, null),
      { q: "x".repeat(100), languages: ["go"], sort: "new" },
    );
  });
});
