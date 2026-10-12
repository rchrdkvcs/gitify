import vine from "@vinejs/vine";
import {
  contributionTypes,
  experienceLevels,
  maxPreferenceLanguages,
  maxPreferenceTopics,
  supportedPreferenceLanguages,
  topicPattern,
} from "#shared/preferences";

/** Trim, lowercase and deduplicate strings; oversized input stays intact for the length rule. */
const canonicalList = (max: number) => (value: unknown) =>
  Array.isArray(value) && value.length <= max
    ? [
        ...new Set(
          value.map((item) => (typeof item === "string" ? item.trim().toLowerCase() : item)),
        ),
      ]
    : value;

/** Fresh schemas for each validator: Vine modifiers must not be shared. */
const fields = () => ({
  level: vine.enum(experienceLevels),
  // Empty lists mean "no preference": every language, every kind of contribution.
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

/** Persist canonical identifiers once each; unsupported choices must be corrected by the caller. */
export const updatePreferencesValidator = vine.create(vine.object(fields()));

/** Onboarding saves one answered question at a time; other fields keep their stored value. */
const progress = fields();
export const onboardingProgressValidator = vine.create(
  vine.object({
    step: vine.number().withoutDecimals().range([1, 4]),
    level: progress.level.optional(),
    languages: progress.languages.optional(),
    contributionTypes: progress.contributionTypes.optional(),
    topics: progress.topics.optional(),
  }),
);
