import { test } from "@japa/runner";
import type { UserPreferences } from "#shared/types/index";
import { parseIssueFilters } from "#feed_criteria/issue_criteria";

const preferences: UserPreferences = {
  level: "first_contribution",
  languages: ["Rust", "typescript"] as UserPreferences["languages"],
  contributionTypes: [],
  topics: [],
};

test.group("Issue criteria", () => {
  test("a first visit uses the reader's languages and issue kind", ({ assert }) => {
    assert.deepEqual(parseIssueFilters({}, preferences), {
      q: "",
      languages: ["rust", "typescript"],
      kind: "good-first-issue",
      unassigned: true,
      sort: "recent",
    });
    assert.equal(
      parseIssueFilters({}, { ...preferences, contributionTypes: ["documentation"] }).kind,
      "documentation",
    );
    assert.deepEqual(parseIssueFilters({}, null), {
      q: "",
      languages: [],
      kind: "all",
      unassigned: true,
      sort: "recent",
    });
  });

  test("explicit parameters replace their own dimension and invalid values fall back", ({
    assert,
  }) => {
    assert.deepEqual(
      parseIssueFilters(
        { q: "  parser  ", language: "GO,unknown,go", label: "documentation", sort: "stars" },
        preferences,
      ),
      { q: "parser", languages: ["go"], kind: "documentation", unassigned: true, sort: "stars" },
    );
    assert.deepEqual(parseIssueFilters({ label: "bug", sort: "random" }, preferences), {
      q: "",
      languages: ["rust", "typescript"],
      kind: "all",
      unassigned: true,
      sort: "recent",
    });
    assert.deepEqual(parseIssueFilters({ language: "" }, preferences).languages, []);
  });

  test("assigned issues only appear after an explicit opt-out", ({ assert }) => {
    assert.isFalse(parseIssueFilters({ unassigned: "0" }, preferences).unassigned);
    assert.isFalse(parseIssueFilters({ unassigned: "false" }, null).unassigned);
    assert.isTrue(parseIssueFilters({ unassigned: "1" }, null).unassigned);
    assert.isTrue(parseIssueFilters({ unassigned: "" }, null).unassigned);
  });
});
