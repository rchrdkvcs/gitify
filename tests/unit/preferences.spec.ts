import { test } from "@japa/runner";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";

test.group("Preference validation", () => {
  test("normalizes language identifiers and saves each language once", async ({ assert }) => {
    const preferences = await updatePreferencesValidator.validate({
      difficulty: "expert",
      languages: [" TypeScript ", "RUST", "typescript", "rust", " C++ "],
    });

    assert.deepEqual(preferences, {
      difficulty: "expert",
      languages: ["typescript", "rust", "c++"],
    });
  });
  test("rejects blank and unsupported language identifiers", async ({ assert }) => {
    for (const languages of [["   "], ["made-up-language"], ["rust", "unsupported"]]) {
      await assert.rejects(() =>
        updatePreferencesValidator.validate({ difficulty: "beginner", languages }),
      );
    }
  });
  test("rejects oversized submissions even when all entries are duplicates", async ({ assert }) => {
    await assert.rejects(() =>
      updatePreferencesValidator.validate({
        difficulty: "beginner",
        languages: Array.from({ length: 14 }, () => "typescript"),
      }),
    );
  });
  test("accepts every supported form and showcase language", async ({ assert }) => {
    const languages = [
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "c#",
      "ruby",
      "go",
      "rust",
      "php",
      "swift",
      "kotlin",
      "dart",
    ];
    const preferences = await updatePreferencesValidator.validate({
      difficulty: "beginner",
      languages,
    });
    assert.deepEqual(preferences.languages, languages);
  });

  test("requires at least one supported language and a valid difficulty", async ({ assert }) => {
    for (const input of [
      { difficulty: "beginner", languages: [] },
      { difficulty: "intermediate", languages: ["rust"] },
      { difficulty: "expert", languages: [123] },
    ]) {
      await assert.rejects(() => updatePreferencesValidator.validate(input));
    }
  });
});
