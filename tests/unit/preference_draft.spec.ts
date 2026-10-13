import { test } from "@japa/runner";
import type { OnboardingProgress } from "#shared/onboarding";
import type { UserPreferences } from "#shared/types/index";
import {
  usePreferenceDraft,
  type PreferenceDraftTransport,
  type PreferenceRoute,
  type PreferenceSubmitCallbacks,
} from "../../inertia/composables/usePreferenceDraft.js";

const stored: UserPreferences = {
  level: "some_contributions",
  languages: ["rust"],
  contributionTypes: ["code"],
  topics: [],
};

class RecordingTransport implements PreferenceDraftTransport {
  submissions: { route: PreferenceRoute; preferences: UserPreferences; preserve: boolean }[] = [];
  answers: OnboardingProgress[] = [];
  callbacks?: PreferenceSubmitCallbacks;

  submit(
    route: PreferenceRoute,
    preferences: UserPreferences,
    callbacks: PreferenceSubmitCallbacks,
    preserve: boolean,
  ) {
    this.submissions.push({ route, preferences, preserve });
    this.callbacks = callbacks;
  }

  async saveAnswer(progress: OnboardingProgress) {
    this.answers.push(progress);
  }
}

test.group("Preference draft", () => {
  test("seeds from stored preferences without sharing their lists", ({ assert }) => {
    const { draft, toggle } = usePreferenceDraft({ stored });
    toggle("languages", "go");
    assert.deepEqual(draft.languages, ["rust", "go"]);
    assert.deepEqual(stored.languages, ["rust"]);
  });

  test("a new account gets the default level, or none when asked to answer it", ({ assert }) => {
    assert.equal(usePreferenceDraft({ stored: null }).draft.level, "first_contribution");
    assert.isNull(usePreferenceDraft({ stored: null, unsetLevel: true }).draft.level);
    assert.equal(
      usePreferenceDraft({ stored, unsetLevel: true }).draft.level,
      "some_contributions",
    );
  });

  test("toggles list values on and off", ({ assert }) => {
    const { draft, toggle } = usePreferenceDraft({ stored });
    toggle("contributionTypes", "design");
    toggle("contributionTypes", "code");
    assert.deepEqual(draft.contributionTypes, ["design"]);
  });

  test("prefills a list only while the user has not chosen it", ({ assert }) => {
    const empty = usePreferenceDraft({ stored: null });
    empty.prefill("languages", ["python"]);
    assert.deepEqual(empty.draft.languages, ["python"]);
    empty.toggle("languages", "go");
    empty.prefill("languages", ["rust"]);
    assert.deepEqual(empty.draft.languages, ["python", "go"]);

    const chosen = usePreferenceDraft({ stored });
    chosen.prefill("languages", ["python"]);
    assert.deepEqual(chosen.draft.languages, ["rust"]);
  });

  test("submits a complete copy and tracks the pending request", ({ assert }) => {
    const transport = new RecordingTransport();
    const { draft, submit, submitting } = usePreferenceDraft({ stored, transport });
    let succeeded = false;

    assert.isTrue(
      submit("/onboarding", { preserveState: true, onSuccess: () => (succeeded = true) }),
    );
    assert.isTrue(submitting.value);
    assert.deepEqual(transport.submissions, [
      { route: "/onboarding", preferences: stored, preserve: true },
    ]);
    assert.notStrictEqual(transport.submissions[0].preferences.languages, draft.languages);

    transport.callbacks?.onSuccess();
    transport.callbacks?.onFinish();
    assert.isTrue(succeeded);
    assert.isFalse(submitting.value);
  });

  test("does not submit without a level", ({ assert }) => {
    const transport = new RecordingTransport();
    const { submit, submitting } = usePreferenceDraft({
      stored: null,
      unsetLevel: true,
      transport,
    });
    assert.isFalse(submit("/auth/preferences"));
    assert.isFalse(submitting.value);
    assert.lengthOf(transport.submissions, 0);
  });

  test("saves the answer of a step under its own field", async ({ assert }) => {
    const transport = new RecordingTransport();
    const { saveAnswer } = usePreferenceDraft({ stored, transport });
    await saveAnswer(1);
    await saveAnswer(3);
    assert.deepEqual(transport.answers, [
      { step: 1, level: "some_contributions" },
      { step: 3, languages: ["rust"] },
    ]);
  });
});
