import vine from "@vinejs/vine";
import {
  answeredOnboardingField,
  firstOnboardingStep,
  lastOnboardingStep,
  type OnboardingProgress,
} from "#shared/onboarding";
import {
  contributionTypes,
  experienceLevels,
  maxPreferenceLanguages,
  maxPreferenceTopics,
  supportedPreferenceLanguages,
  topicPattern,
} from "#shared/preferences";

const canonicalList = (max: number) => (value: unknown) =>
  Array.isArray(value) && value.length <= max
    ? [
        ...new Set(
          value.map((item) => (typeof item === "string" ? item.trim().toLowerCase() : item)),
        ),
      ]
    : value;

const fields = () => ({
  level: vine.enum(experienceLevels),
  languages: vine
    .array(vine.enum(supportedPreferenceLanguages))
    .parse(canonicalList(maxPreferenceLanguages))
    .maxLength(maxPreferenceLanguages),
  contributionTypes: vine
    .array(vine.enum(contributionTypes))
    .parse(canonicalList(contributionTypes.length))
    .maxLength(contributionTypes.length),
  topics: vine
    .array(vine.string().regex(topicPattern))
    .parse(canonicalList(maxPreferenceTopics))
    .maxLength(maxPreferenceTopics),
});

export const updatePreferencesValidator = vine.create(vine.object(fields()));

const answersItsOwnStep = vine.createRule((value, _options, field) => {
  if (field.isValid && !answeredOnboardingField(value as OnboardingProgress)) {
    field.report("The {{ field }} must answer the question of its step", "onboardingAnswer", field);
  }
});

const progress = fields();
export const onboardingProgressValidator = vine.create(
  vine
    .object({
      step: vine.number().withoutDecimals().range([firstOnboardingStep, lastOnboardingStep]),
      level: progress.level.optional(),
      languages: progress.languages.optional(),
      contributionTypes: progress.contributionTypes.optional(),
      topics: progress.topics.optional(),
    })
    .use(answersItsOwnStep()),
);
