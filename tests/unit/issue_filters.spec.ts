import { test } from "@japa/runner";
import { issueKindForDifficulty, issueSignals, isSignalLabel } from "#shared/issues";
import { parseIssueFilters } from "#validators/issue_filters";

const preferences = { difficulty: "beginner" as const, languages: ["Rust", "typescript"] };

test.group("Issue feed filters", () => {
  test("a first visit uses the reader's languages and the label family of their level", ({
    assert,
  }) => {
    assert.deepEqual(parseIssueFilters({}, preferences), {
      q: "",
      languages: ["rust", "typescript"],
      kind: "good-first-issue",
      unassigned: true,
      sort: "recent",
    });
    assert.equal(
      parseIssueFilters({}, { ...preferences, difficulty: "expert" }).kind,
      "help-wanted",
    );
    assert.deepEqual(parseIssueFilters({}, null), {
      q: "",
      languages: [],
      kind: "all",
      unassigned: true,
      sort: "recent",
    });
  });

  test("explicit parameters replace preferences and invalid values fall back", ({ assert }) => {
    assert.deepEqual(
      parseIssueFilters(
        {
          q: "  parser  ",
          language: "GO,unknown,go",
          label: "documentation",
          sort: "stars",
        },
        preferences,
      ),
      { q: "parser", languages: ["go"], kind: "documentation", unassigned: true, sort: "stars" },
    );
    assert.deepEqual(parseIssueFilters({ label: "bug", sort: "random" }, preferences), {
      q: "",
      languages: [],
      kind: "all",
      unassigned: true,
      sort: "recent",
    });
    assert.lengthOf(parseIssueFilters({ q: "x".repeat(300) }, null).q, 100);
  });

  test("assigned issues only appear after an explicit opt-out", ({ assert }) => {
    assert.isFalse(parseIssueFilters({ unassigned: "0" }, preferences).unassigned);
    assert.isFalse(parseIssueFilters({ unassigned: "false" }, null).unassigned);
    assert.isTrue(parseIssueFilters({ unassigned: "1" }, null).unassigned);
    assert.isTrue(parseIssueFilters({ unassigned: "" }, null).unassigned);
  });

  test("levels without a label family show every kind", ({ assert }) => {
    assert.equal(issueKindForDifficulty("intermediate"), "all");
  });
});

test.group("Issue contribution signals", () => {
  test("recognise the usual spellings of contribution labels", ({ assert }) => {
    assert.deepEqual(issueSignals([{ name: "Good First Issue" }, { name: "bug" }]), {
      isGoodFirstIssue: true,
      isHelpWanted: false,
    });
    assert.deepEqual(
      issueSignals([{ name: "good-first-issue 👋" }, { name: "status: help_wanted" }]),
      {
        isGoodFirstIssue: true,
        isHelpWanted: true,
      },
    );
    assert.deepEqual(issueSignals([]), { isGoodFirstIssue: false, isHelpWanted: false });
    assert.isTrue(isSignalLabel("Help Wanted"));
    assert.isFalse(isSignalLabel("documentation"));
  });
});
