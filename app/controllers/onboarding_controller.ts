import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import GitHubCredentials from "#services/github/github_credentials";
import OnboardingService from "#services/onboarding_service";
import { resumeOnboardingStep } from "#shared/onboarding";
import {
  onboardingProgressValidator,
  updatePreferencesValidator,
} from "#validators/update_preferences_validator";

@inject()
export default class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly credentials: GitHubCredentials,
  ) {}

  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail();
    return inertia.render("onboarding", {
      initialStep: resumeOnboardingStep(user),
      suggestedLanguages: inertia.defer(() =>
        this.onboarding.suggestLanguages(user, this.credentials.readerFor(user)),
      ),
    });
  }

  async progress({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await this.onboarding.saveAnswer(
      user,
      await request.validateUsing(onboardingProgressValidator),
    );
    return response.ok({ step: user.onboardingStep });
  }

  async complete({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    await this.onboarding.completeWith(
      user,
      await request.validateUsing(updatePreferencesValidator),
    );
    return response.redirect("/onboarding");
  }

  async skip({ auth, response }: HttpContext) {
    await this.onboarding.skip(auth.getUserOrFail());
    return response.redirect("/explore");
  }
}
