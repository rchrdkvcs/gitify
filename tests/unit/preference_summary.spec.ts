import { test } from "@japa/runner";
import { summarizePreferences } from "#shared/preference_summary";

test.group("Preference summary", () => {
  test("lists chosen values with their public labels", ({ assert }) => {
    const summary = summarizePreferences({
      level: "experienced",
      languages: ["typescript", "c++"],
      contributionTypes: ["tests", "code"],
      topics: ["cli", "web"],
    });
    assert.equal(summary.level?.title, "Contributeur aguerri");
    assert.isString(summary.level?.description);
    assert.deepEqual(summary.contributionTypes, { values: ["Code", "Tests"], text: "Code, Tests" });
    assert.deepEqual(summary.languages, {
      values: ["TypeScript", "C++"],
      text: "TypeScript, C++",
    });
    assert.deepEqual(summary.topics, { values: ["cli", "web"], text: "cli, web" });
  });

  test("empty choices read as no preference", ({ assert }) => {
    const summary = summarizePreferences({
      level: "first_contribution",
      languages: [],
      contributionTypes: [],
      topics: [],
    });
    assert.deepEqual(summary.contributionTypes, { values: [], text: "Toutes" });
    assert.deepEqual(summary.languages, { values: [], text: "Tous" });
    assert.deepEqual(summary.topics, { values: [], text: "Aucun" });
  });
});
