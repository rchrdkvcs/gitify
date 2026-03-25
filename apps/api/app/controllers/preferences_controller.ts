import type { HttpContext } from "@adonisjs/core/http";

import { updatePreferencesValidator } from "#validators/update_preferences_validator";

export default class PreferencesController {
  /**
   * Updates the authenticated user's project matching preferences.
   * This handles both the initial Onboarding and future settings updates.
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!;

    /**
     * Validate the incoming HTTP request body against our VineJS schema
     * Update the user model and save to PostgresSQL
     */
    user.preferences = await request.validateUsing(updatePreferencesValidator);
    await user.save();

    return response.ok({ message: "Preferences updated successfully", user });
  }
}
