import { router } from "@inertiajs/vue3";
import { reactive, ref } from "vue";
import type { ExperienceLevel, UserPreferences } from "../../shared/types/index.js";
import { onboardingFieldAt, type OnboardingProgress } from "../../shared/onboarding.js";
import { defaultUserPreferences } from "../../shared/preferences.js";
import { http } from "../lib/http.js";

export type PreferenceDraft = Omit<UserPreferences, "level"> & { level: ExperienceLevel | null };
export type PreferenceListField = "languages" | "contributionTypes" | "topics";
export type PreferenceRoute = "/auth/preferences" | "/onboarding";

export interface PreferenceSubmitCallbacks {
  onSuccess(): void;
  onError(): void;
  onFinish(): void;
}

export interface PreferenceDraftTransport {
  submit(
    route: PreferenceRoute,
    preferences: UserPreferences,
    callbacks: PreferenceSubmitCallbacks,
    preserveState: boolean,
  ): void;
  saveAnswer(progress: OnboardingProgress): Promise<unknown>;
}

export interface PreferenceDraftOptions {
  stored: UserPreferences | null;
  unsetLevel?: boolean;
  transport?: PreferenceDraftTransport;
}

export interface SubmitOptions {
  preserveState?: boolean;
  onSuccess?(): void;
  onError?(): void;
}

const listFields: PreferenceListField[] = ["languages", "contributionTypes", "topics"];

const inertiaTransport: PreferenceDraftTransport = {
  submit: (route, preferences, callbacks, preserveState) =>
    router.put(route, preferences, {
      preserveState,
      preserveScroll: preserveState,
      ...callbacks,
    }),
  saveAnswer: (progress) => http("/api/onboarding", { method: "PATCH", body: progress }),
};

export function seedPreferenceDraft(
  stored: UserPreferences | null,
  unsetLevel = false,
): PreferenceDraft {
  return {
    level: stored?.level ?? (unsetLevel ? null : defaultUserPreferences.level),
    languages: [...(stored?.languages ?? [])],
    contributionTypes: [...(stored?.contributionTypes ?? [])],
    topics: [...(stored?.topics ?? [])],
  };
}

export function usePreferenceDraft({
  stored,
  unsetLevel = false,
  transport = inertiaTransport,
}: PreferenceDraftOptions) {
  const draft = reactive<PreferenceDraft>(seedPreferenceDraft(stored, unsetLevel));
  const submitting = ref(false);
  const touched = new Set(listFields.filter((field) => draft[field].length > 0));

  function setList(field: PreferenceListField, values: string[]) {
    (draft[field] as string[]) = values;
  }

  function toggle(field: PreferenceListField, value: string) {
    touched.add(field);
    const list = draft[field] as string[];
    setList(field, list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function prefill(field: PreferenceListField, values: readonly string[]) {
    if (!touched.has(field) && values.length) setList(field, [...values]);
  }

  function snapshot(): UserPreferences | null {
    if (!draft.level) return null;
    return {
      level: draft.level,
      languages: [...draft.languages],
      contributionTypes: [...draft.contributionTypes],
      topics: [...draft.topics],
    };
  }

  function submit(route: PreferenceRoute, options: SubmitOptions = {}): boolean {
    const preferences = snapshot();
    if (!preferences) return false;
    submitting.value = true;
    transport.submit(
      route,
      preferences,
      {
        onSuccess: () => options.onSuccess?.(),
        onError: () => options.onError?.(),
        onFinish: () => {
          submitting.value = false;
        },
      },
      options.preserveState ?? false,
    );
    return true;
  }

  function saveAnswer(step: number): Promise<unknown> {
    const field = onboardingFieldAt(step);
    return transport.saveAnswer({ step, [field]: draft[field] });
  }

  return { draft, submitting, toggle, prefill, submit, saveAnswer };
}

export type PreferenceDraftHandle = ReturnType<typeof usePreferenceDraft>;
