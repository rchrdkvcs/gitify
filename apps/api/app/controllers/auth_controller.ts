import type { HttpContext } from "@adonisjs/core/http";

import User from "#models/user";
import env from "#start/env";

/**
 * AuthController
 * Handles the GitHub OAuth flow, user persistence, and session management
 * using AdonisJS native Opaque Tokens and HTTP-Only cookies.
 */
export default class AuthController {
  /**
   * Redirects the user to the GitHub OAuth authorization page.
   */
  async redirect({ ally }: HttpContext) {
    return ally.use("github").redirect();
  }

  /**
   * Handles the callback from GitHub, retrieves user data,
   * upserts the user in the DB, and establishes a secure session.
   */
  async callback({ ally, response }: HttpContext) {
    const github = ally.use("github");

    // Handle OAuth error states
    if (github.accessDenied()) {
      return response.badRequest("Access Denied: You cancelled the login request.");
    }
    if (github.stateMisMatch()) {
      return response.badRequest("State Mismatch: Session expired or invalid.");
    }
    if (github.hasError()) {
      return response.badRequest(`GitHub Error: ${github.getError()}`);
    }

    const githubUser = await github.user();

    // Persist or update user information in the database
    const user = await User.updateOrCreate(
      {
        email: githubUser.email,
      },
      {
        name: githubUser.name,
        avatarUrl: githubUser.avatarUrl,
        accessToken: githubUser.token.token,
        isVerified: githubUser.emailVerificationState === "verified",
      },
    );

    const token = await User.accessTokens.create(user, ["*"], { expiresIn: "7 days" });
    const plainToken = token.value!.release();

    // Store the token in a secure HTTP-Only cookie to prevent XSS attacks
    response.cookie("gitmatch_session", plainToken, {
      httpOnly: true,
      secure: env.get("NODE_ENV") === "production",
      sameSite: "lax",
      maxAge: "7d",
    });

    if (env.get("ENABLE_DEV_TOKEN")) {
      response.cookie("gitmatch_dev_token", plainToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: "7d",
      });
    }

    // Redirect the user back to the Nuxt frontend
    return response.redirect(env.get("FRONTEND_URL"));
  }

  async dev({ request, response }: HttpContext) {
    const token = request.cookie("gitmatch_dev_token");

    if (!token) {
      return response.unauthorized({
        error: "No dev token found, login first via /auth/github/redirect",
      });
    }

    return response.json({ token });
  }

  /**
   * Returns the currently authenticated user's profile.
   */
  async me({ auth, response }: HttpContext) {
    // TODO : serialize sensitive data
    return response.ok({ user: auth.user });
  }

  /**
   * Revokes the access token and clears the authentication cookie.
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!;
    // Revoke the token in the database
    await User.accessTokens.delete(user, user.currentAccessToken.identifier);
    // Clear the cookie in the user's browser
    response.clearCookie("gitmatch_session");
    return response.ok({ message: "Successfully logged out" });
  }
}
