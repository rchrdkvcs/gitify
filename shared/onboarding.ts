import type { UserPreferences } from "./types/user.js";

export const onboardingSteps = [
  { field: "level", label: "Niveau" },
  { field: "contributionTypes", label: "Contributions" },
  { field: "languages", label: "Langages" },
  { field: "topics", label: "Centres d’intérêt" },
] as const satisfies readonly { field: keyof UserPreferences; label: string }[];

export type OnboardingField = (typeof onboardingSteps)[number]["field"];

export type OnboardingProgress = Partial<UserPreferences> & { step: number };

export interface OnboardingRecord {
  preferences: UserPreferences;
  answeredSteps: number;
}

export const firstOnboardingStep = 1;
export const lastOnboardingStep = onboardingSteps.length;
export const onboardingFinishStep = lastOnboardingStep + 1;

export function clampOnboardingStep(step: number): number {
  return Math.min(
    Math.max(Math.trunc(step) || firstOnboardingStep, firstOnboardingStep),
    lastOnboardingStep,
  );
}

export function onboardingFieldAt(step: number): OnboardingField {
  return onboardingSteps[clampOnboardingStep(step) - 1].field;
}

export function onboardingStepOf(field: OnboardingField): number {
  return onboardingSteps.findIndex((step) => step.field === field) + 1;
}

export function resumeOnboardingStep(user: {
  onboardedAt: unknown;
  onboardingStep: number | null;
}): number {
  if (user.onboardedAt) {
    return firstOnboardingStep;
  }
  return clampOnboardingStep(Math.max(user.onboardingStep ?? 0, 0) + 1);
}

export function nextOnboardingStep(step: number): number {
  return Math.min(step + 1, onboardingFinishStep);
}

export function previousOnboardingStep(step: number): number {
  return Math.max(step - 1, firstOnboardingStep);
}

export function canRevisitOnboardingStep(target: number, answeredSteps: number): boolean {
  return target >= firstOnboardingStep && target <= Math.min(answeredSteps, lastOnboardingStep);
}

export function answeredOnboardingField(progress: OnboardingProgress): OnboardingField | null {
  if (progress.step < firstOnboardingStep || progress.step > lastOnboardingStep) {
    return null;
  }
  const expected = onboardingFieldAt(progress.step);
  const answered = onboardingSteps
    .map((step) => step.field)
    .filter((field) => progress[field] !== undefined);
  return answered.length === 1 && answered[0] === expected ? expected : null;
}

export function recordOnboardingAnswer(
  record: { preferences: UserPreferences; answeredSteps: number | null },
  progress: OnboardingProgress,
): OnboardingRecord {
  const field = answeredOnboardingField(progress);
  if (!field) {
    throw new RangeError(`Step ${progress.step} must answer only its own question`);
  }
  return {
    preferences: { ...record.preferences, [field]: progress[field] },
    answeredSteps: Math.max(record.answeredSteps ?? 0, progress.step),
  };
}
