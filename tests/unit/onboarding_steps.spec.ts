import { test } from "@japa/runner";
import {
  answeredOnboardingField,
  canRevisitOnboardingStep,
  clampOnboardingStep,
  lastOnboardingStep,
  nextOnboardingStep,
  onboardingFieldAt,
  onboardingFinishStep,
  onboardingStepOf,
  onboardingSteps,
  previousOnboardingStep,
  recordOnboardingAnswer,
  resumeOnboardingStep,
} from "#shared/onboarding";
import { defaultUserPreferences } from "#shared/preferences";

test.group("Onboarding steps", () => {
  test("each step answers one preference field, in order", ({ assert }) => {
    assert.deepEqual(
      onboardingSteps.map((step) => step.field),
      ["level", "contributionTypes", "languages", "topics"],
    );
    assert.equal(lastOnboardingStep, 4);
    assert.equal(onboardingFinishStep, 5);
    assert.equal(onboardingFieldAt(3), "languages");
    assert.equal(onboardingStepOf("topics"), 4);
  });

  test("clamps any step into the questions", ({ assert }) => {
    assert.equal(clampOnboardingStep(-2), 1);
    assert.equal(clampOnboardingStep(0), 1);
    assert.equal(clampOnboardingStep(2.7), 2);
    assert.equal(clampOnboardingStep(9), lastOnboardingStep);
    assert.equal(clampOnboardingStep(Number.NaN), 1);
  });

  test("resumes on the first unanswered question, or reviews from the start", ({ assert }) => {
    assert.equal(resumeOnboardingStep({ onboardedAt: null, onboardingStep: null }), 1);
    assert.equal(resumeOnboardingStep({ onboardedAt: null, onboardingStep: 2 }), 3);
    assert.equal(resumeOnboardingStep({ onboardedAt: null, onboardingStep: 4 }), 4);
    assert.equal(resumeOnboardingStep({ onboardedAt: null, onboardingStep: -3 }), 1);
    assert.equal(resumeOnboardingStep({ onboardedAt: "2026-10-01", onboardingStep: 4 }), 1);
  });

  test("moves forward to the finish screen and back to the first question", ({ assert }) => {
    assert.equal(nextOnboardingStep(1), 2);
    assert.equal(nextOnboardingStep(lastOnboardingStep), onboardingFinishStep);
    assert.equal(nextOnboardingStep(onboardingFinishStep), onboardingFinishStep);
    assert.equal(previousOnboardingStep(3), 2);
    assert.equal(previousOnboardingStep(1), 1);
  });

  test("only answered questions can be revisited", ({ assert }) => {
    assert.isTrue(canRevisitOnboardingStep(1, 2));
    assert.isTrue(canRevisitOnboardingStep(2, 2));
    assert.isFalse(canRevisitOnboardingStep(3, 2));
    assert.isFalse(canRevisitOnboardingStep(0, 4));
    assert.isFalse(canRevisitOnboardingStep(onboardingFinishStep, 9));
  });

  test("a step must answer its own question and nothing else", ({ assert }) => {
    assert.equal(answeredOnboardingField({ step: 1, level: "experienced" }), "level");
    assert.equal(answeredOnboardingField({ step: 4, topics: [] }), "topics");
    assert.isNull(answeredOnboardingField({ step: 4 }));
    assert.isNull(answeredOnboardingField({ step: 4, level: "experienced" }));
    assert.isNull(answeredOnboardingField({ step: 2, contributionTypes: ["code"], topics: [] }));
    assert.isNull(answeredOnboardingField({ step: 5, topics: [] }));
  });

  test("records an answer and never moves the answered steps backwards", ({ assert }) => {
    const record = recordOnboardingAnswer(
      { preferences: defaultUserPreferences, answeredSteps: 3 },
      { step: 2, contributionTypes: ["design"] },
    );
    assert.deepEqual(record, {
      preferences: { ...defaultUserPreferences, contributionTypes: ["design"] },
      answeredSteps: 3,
    });
    assert.equal(
      recordOnboardingAnswer(
        { preferences: defaultUserPreferences, answeredSteps: null },
        { step: 1, level: "experienced" },
      ).answeredSteps,
      1,
    );
  });

  test("refuses to record a step without its answer", ({ assert }) => {
    assert.throws(
      () =>
        recordOnboardingAnswer(
          { preferences: defaultUserPreferences, answeredSteps: 0 },
          { step: 4, level: "experienced" },
        ),
      /Step 4/,
    );
  });
});
