import vine from "@vinejs/vine";
import { maxPreferenceLanguages, supportedPreferenceLanguages } from "#shared/preferences";

/** Persist canonical identifiers once each; unsupported choices must be corrected by the caller. */
export const updatePreferencesValidator = vine.create(
  vine.object({
    difficulty: vine.enum(["beginner", "expert"]),
    languages: vine
      .array(vine.enum(supportedPreferenceLanguages))
      // Keep oversized input intact so the length rule rejects it before deduplication.
      .parse((value) =>
        Array.isArray(value) && value.length <= maxPreferenceLanguages
          ? [
              ...new Set(
                value.map((language) =>
                  typeof language === "string" ? language.trim().toLowerCase() : language,
                ),
              ),
            ]
          : value,
      )
      .minLength(1)
      .maxLength(maxPreferenceLanguages),
  }),
);
