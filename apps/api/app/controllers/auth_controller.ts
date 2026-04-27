import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import env from "#start/env";

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

    const user = await User.updateOrCreate(
      { email: driverUser.email },
      {
        name: driverUser.name ?? driverUser.original.login,
        avatarUrl: driverUser.avatarUrl,
        githubAccessToken: driverUser.token.token,
        isVerified: driverUser.emailVerificationState === "verified",
      },
    );

    await auth.use("web").login(user);

    return response.redirect(env.get("FRONTEND_URL"));
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use("web").logout();
    return response.ok({ message: "Successfully logged out" });
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.use("web").getUserOrFail();

    return response.ok({ user });
  }
}
