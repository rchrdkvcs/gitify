import type { HttpContext } from "@adonisjs/core/http";
import OAuthCallbackException from "#exceptions/oauth_callback_exception";
import AuthService from "#services/auth_service";
import onboarding from "#services/onboarding_service";

export default class AuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use("github").redirect();
  }

  async callback({ ally, response, auth }: HttpContext) {
    const githubDriver = ally.use("github");

    if (githubDriver.accessDenied()) {
      throw new OAuthCallbackException("access_denied");
    }
    if (githubDriver.stateMisMatch()) {
      throw new OAuthCallbackException("state_mismatch");
    }
    if (githubDriver.hasError()) {
      throw new OAuthCallbackException("provider_error", { cause: githubDriver.getError() });
    }

    const driverUser = await githubDriver.user();
    const user = await AuthService.findOrCreateFromGitHub(driverUser);

    await auth.use("web").login(user);

    return response.redirect(onboarding.landingPath(user));
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use("web").logout();
    return response.redirect("/");
  }
}
