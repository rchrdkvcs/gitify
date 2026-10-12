import type { HttpContext } from "@adonisjs/core/http";
import AuthService from "#services/auth_service";

export default class AuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use("github").redirect();
  }

  async callback({ ally, response, auth }: HttpContext) {
    const githubDrive = ally.use("github");

    if (githubDrive.accessDenied()) {
      return response.badRequest("Access Denied: You cancelled the login request.");
    }
    if (githubDrive.stateMisMatch()) {
      return response.badRequest("State Mismatch: Session expired or invalid.");
    }
    if (githubDrive.hasError()) {
      return response.badRequest(`GitHub Error: ${githubDrive.getError()}`);
    }

    const driverUser = await githubDrive.user();
    const user = await AuthService.findOrCreateFromGitHub(driverUser);

    await auth.use("web").login(user);

    return response.redirect(user.preferences ? "/explore" : "/preferences");
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use("web").logout();
    return response.redirect("/");
  }
}
