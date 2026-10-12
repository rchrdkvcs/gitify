import { test } from "@japa/runner";
import {
  difficultyForLevel,
  inferPreferredLanguages,
  languageCatalog,
  levelForDifficulty,
  normalizeUserPreferences,
} from "#shared/preferences";
import {
  onboardingProgressValidator,
  updatePreferencesValidator,
} from "#validators/update_preferences_validator";

const valid = {
  level: "some_contributions",
  languages: ["typescript"],
  contributionTypes: ["code"],
  topics: [],
};

test.group("Preference validation", () => {
  test("normalizes identifiers and saves each choice once", async ({ assert }) => {
    const preferences = await updatePreferencesValidator.validate({
      level: "experienced",
      languages: [" TypeScript ", "RUST", "typescript", "rust", " C++ "],
      contributionTypes: ["Documentation", "code", "documentation"],
      topics: [" CLI ", "cli", "machine-learning"],
    });

    assert.deepEqual(preferences, {
      level: "experienced",
      languages: ["typescript", "rust", "c++"],
      contributionTypes: ["documentation", "code"],
      topics: ["cli", "machine-learning"],
    });
  });

  test("empty lists mean no preference, so non-coders can skip languages", async ({ assert }) => {
    const preferences = await updatePreferencesValidator.validate({
      level: "first_contribution",
      languages: [],
      contributionTypes: ["translation"],
      topics: [],
    });
    assert.deepEqual(preferences.languages, []);
  });

  test("rejects unknown levels, languages, contribution types and malformed topics", async ({
    assert,
  }) => {
    for (const input of [
      { ...valid, level: "intermediate" },
      // The legacy binary payload is no longer accepted.
      { difficulty: "beginner", languages: ["rust"] },
      { ...valid, languages: ["   "] },
      { ...valid, languages: ["made-up-language"] },
      { ...valid, languages: [123] },
      { ...valid, contributionTypes: ["marketing"] },
      { ...valid, topics: ["Not a topic!"] },
    ]) {
      await assert.rejects(() => updatePreferencesValidator.validate(input));
    }
  });

  test("rejects oversized submissions even when all entries are duplicates", async ({ assert }) => {
    await assert.rejects(() =>
      updatePreferencesValidator.validate({
        ...valid,
        languages: Array.from({ length: languageCatalog.length + 1 }, () => "typescript"),
      }),
    );
    await assert.rejects(() =>
      updatePreferencesValidator.validate({
        ...valid,
        topics: Array.from({ length: 11 }, (_, i) => `topic-${i}`),
      }),
    );
  });

  test("accepts every catalogue language, including the extended ones", async ({ assert }) => {
    const languages = languageCatalog.map((language) => language.id);
    for (const id of ["c", "c#", "elixir", "zig", "scala", "haskell", "lua", "shell"]) {
      assert.include(languages, id);
    }
    const preferences = await updatePreferencesValidator.validate({ ...valid, languages });
    assert.deepEqual(preferences.languages, languages);
  });

  test("onboarding progress accepts one answer at a time within the four questions", async ({
    assert,
  }) => {
    assert.deepEqual(
      await onboardingProgressValidator.validate({ step: 2, contributionTypes: ["design"] }),
      { step: 2, contributionTypes: ["design"] },
    );
    for (const input of [{ step: 0 }, { step: 5 }, { step: 1, level: "guru" }]) {
      await assert.rejects(() => onboardingProgressValidator.validate(input));
    }
  });
});

test.group("Preference mapping", () => {
  test("maps the legacy binary difficulty onto experience levels", ({ assert }) => {
    assert.deepEqual(
      normalizeUserPreferences({ difficulty: "beginner", languages: ["TypeScript", "cobol"] }),
      {
        level: "first_contribution",
        languages: ["typescript"],
        contributionTypes: ["code"],
        topics: [],
      },
    );
    assert.equal(
      normalizeUserPreferences({ difficulty: "expert", languages: [] })?.level,
      "experienced",
    );
    assert.equal(levelForDifficulty("unknown"), "first_contribution");
  });

  test("keeps the current shape, drops unknown entries and rejects non-objects", ({ assert }) => {
    const current = {
      level: "some_contributions",
      languages: ["rust"],
      contributionTypes: ["tests", "tests", "marketing"],
      topics: ["CLI", "bad topic"],
    };
    assert.deepEqual(normalizeUserPreferences(current), {
      level: "some_contributions",
      languages: ["rust"],
      contributionTypes: ["tests"],
      topics: ["cli"],
    });
    // A new-shape draft without any contribution type keeps "no preference".
    assert.deepEqual(
      normalizeUserPreferences({ level: "experienced", languages: [] })?.contributionTypes,
      [],
    );
    for (const raw of [null, "beginner", [], 42]) {
      assert.isNull(normalizeUserPreferences(raw));
    }
  });

  test("levels drive the catalogue search level", ({ assert }) => {
    assert.equal(difficultyForLevel("first_contribution"), "beginner");
    assert.equal(difficultyForLevel("some_contributions"), "beginner");
    assert.equal(difficultyForLevel("experienced"), "expert");
  });

  test("infers the most used catalogue languages from GitHub repositories", ({ assert }) => {
    assert.deepEqual(
      inferPreferredLanguages([
        "TypeScript",
        "Rust",
        null,
        "Jupyter Notebook",
        "Python",
        "TypeScript",
        "COBOL",
        "Rust",
        "TypeScript",
        "Shell",
        "C#",
      ]),
      ["typescript", "rust", "python", "shell"],
    );
    assert.deepEqual(inferPreferredLanguages(["Go", "C#"], 1), ["go"]);
    assert.deepEqual(inferPreferredLanguages([]), []);
  });
});
