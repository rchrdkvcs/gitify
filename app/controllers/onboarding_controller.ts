import type { HttpContext } from "@adonisjs/core/http";
import onboarding from "#services/onboarding_service";
import { resumeOnboardingStep } from "#shared/onboarding";
import {
  onboardingProgressValidator,
  updatePreferencesValidator,
} from "#validators/update_preferences_validator";

export default class OnboardingController {
  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail();
    return inertia.render("onboarding", {
      initialStep: resumeOnboardingStep(user),
      suggestedLanguages: inertia.defer(() => onboarding.suggestLanguages(user)),
    });
  }

  async progress({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await onboarding.saveAnswer(user, await request.validateUsing(onboardingProgressValidator));
    return response.ok({ step: user.onboardingStep });
  }

  async complete({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await onboarding.completeWith(user, await request.validateUsing(updatePreferencesValidator));
    return response.redirect("/onboarding");
  }

  async skip({ auth, response }: HttpContext) {
    await onboarding.skip(auth.getUserOrFail());
    return response.redirect("/explore");
  }
}
