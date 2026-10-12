import type { HttpContext } from "@adonisjs/core/http";
import onboarding from "#services/onboarding_service";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";

export default class PreferencesController {
  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();

    // Saving every answer from the preferences page completes the onboarding as well.
    await onboarding.complete(user, await request.validateUsing(updatePreferencesValidator));

    return response.redirect("/explore");
  }
}
