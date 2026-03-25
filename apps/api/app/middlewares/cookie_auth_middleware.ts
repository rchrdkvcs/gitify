import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Cookie Auth Middleware
 * Extracts the Opaque Token stored securely in the 'gitmatch_session' HTTP-Only cookie
 * and injects it into the Authorization header. This bridges our secure cookie strategy
 * with AdonisJS native API guard mechanisms.
 */
export default class CookieAuthMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const token = request.cookie("gitmatch_session");

    if (token) {
      request.request.headers["authorization"] = `Bearer ${token}`;
      request.headers().authorization = `Bearer ${token}`;
    }

    return next();
  }
}
