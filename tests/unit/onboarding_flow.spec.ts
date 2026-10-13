import { test } from "@japa/runner";
import type { OnboardingProgress } from "#shared/onboarding";
import { useOnboardingFlow } from "../../inertia/composables/useOnboardingFlow.js";
import {
  usePreferenceDraft,
  type PreferenceDraftTransport,
  type PreferenceSubmitCallbacks,
} from "../../inertia/composables/usePreferenceDraft.js";

function setup(initialStep: number, answeredSteps: number | null = null) {
  const answers: OnboardingProgress[] = [];
  const submissions: PreferenceSubmitCallbacks[] = [];
  const transport: PreferenceDraftTransport = {
    submit: (_route, _preferences, callbacks) => submissions.push(callbacks),
    saveAnswer: async (progress) => answers.push(progress),
  };
  const preferences = usePreferenceDraft({ stored: null, unsetLevel: true, transport });
  const flow = useOnboardingFlow({
    initialStep,
    answeredSteps,
    preferences,
    onAnswerNotSaved: () => {},
  });
  return { flow, preferences, answers, submissions };
}

test.group("Onboarding flow", () => {
  test("starts on a clamped step and blocks a missing required answer", ({ assert }) => {
    const { flow, answers } = setup(0);
    assert.equal(flow.step.value, 1);
    flow.next();
    assert.equal(flow.step.value, 1);
    assert.isString(flow.error.value);
    assert.lengthOf(answers, 0);
  });

  test("saves each confirmed answer and moves forward", ({ assert }) => {
    const { flow, preferences, answers } = setup(1);
    preferences.draft.level = "experienced";
    flow.next();
    assert.equal(flow.step.value, 2);
    assert.equal(flow.reached.value, 1);
    assert.deepEqual(answers, [{ step: 1, level: "experienced" }]);
    flow.select(3);
    assert.equal(flow.step.value, 2);
    flow.back();
    assert.equal(flow.step.value, 1);
    assert.equal(flow.direction.value, "back");
  });

  test("the last question submits every answer, then shows the finish screen", ({ assert }) => {
    const { flow, preferences, answers, submissions } = setup(4, 3);
    preferences.draft.level = "some_contributions";
    flow.next();
    assert.lengthOf(answers, 0);
    assert.lengthOf(submissions, 1);
    assert.isFalse(flow.finished.value);
    submissions[0].onSuccess();
    assert.isTrue(flow.finished.value);
  });
});
