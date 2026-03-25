import vine from "@vinejs/vine";

/**
 * Validator for updating user preferences.
 * Ensures the incoming data matches the UserPreferences type.
 */
export const updatePreferencesValidator = vine.create(
  vine.object({
    difficulty: vine.enum(["beginner", "expert"]),
    languages: vine.array(vine.string().trim().escape()).minLength(1),
  }),
);
