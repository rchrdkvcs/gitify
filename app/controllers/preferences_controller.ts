import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import OnboardingService from "#services/onboarding_service";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";

@inject()
export default class PreferencesController {
  constructor(private readonly onboarding: OnboardingService) {}

  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await this.onboarding.completeWith(
      user,
      await request.validateUsing(updatePreferencesValidator),
    );
    return response.redirect("/explore");
  }
}
