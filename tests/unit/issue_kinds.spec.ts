import { test } from "@japa/runner";
import type { ContributionType, ExperienceLevel } from "#shared/types/index";
import { defaultIssueKind, issueSignals, isSignalLabel } from "#shared/issues";

const kindFor = (level: ExperienceLevel, contributionTypes: ContributionType[] = []) =>
  defaultIssueKind({ level, contributionTypes });

test.group("Default issue kind", () => {
  test("code contributions get the label family of the reader's level", ({ assert }) => {
    assert.equal(kindFor("first_contribution", ["code"]), "good-first-issue");
    assert.equal(kindFor("some_contributions"), "good-first-issue");
    assert.equal(kindFor("experienced", ["code"]), "help-wanted");
  });

  test("a documentation contribution type selects documentation issues", ({ assert }) => {
    assert.equal(kindFor("first_contribution", ["documentation"]), "documentation");
    assert.equal(kindFor("experienced", ["documentation", "tests"]), "documentation");
  });

  test("code wins over documentation and unmatched types fall back to the level", ({ assert }) => {
    assert.equal(kindFor("first_contribution", ["documentation", "code"]), "good-first-issue");
    assert.equal(kindFor("experienced", ["tests", "design"]), "help-wanted");
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
