import type { HttpContext } from "@adonisjs/core/http";
import onboarding from "#services/onboarding_service";
import {
  onboardingProgressValidator,
  updatePreferencesValidator,
} from "#validators/update_preferences_validator";

export default class OnboardingController {
  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail();
    return inertia.render("onboarding", {
      initialStep: onboarding.resumeStep(user),
      // Calls GitHub with the user's token: loaded after the first paint.
      suggestedLanguages: inertia.defer(() => onboarding.suggestLanguages(user)),
    });
  }

  /** JSON: saves one confirmed answer without leaving the page. */
  async progress({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await onboarding.saveProgress(user, await request.validateUsing(onboardingProgressValidator));
    return response.ok({ step: user.onboardingStep });
  }

  async complete({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await onboarding.complete(user, await request.validateUsing(updatePreferencesValidator));
    // The page shows its finish screen; the redirect only refreshes the shared user.
    return response.redirect("/onboarding");
  }

  async skip({ auth, response }: HttpContext) {
    await onboarding.skip(auth.getUserOrFail());
    return response.redirect("/explore");
  }
}
