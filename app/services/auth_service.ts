import { Exception } from "@adonisjs/core/exceptions";
import db from "@adonisjs/lucid/services/db";
import User from "#models/user";

interface GitHubDriverUser {
  // Ally's declaration says string, but its GitHub implementation returns a number.
  id: unknown;
  email: string;
  name: string | null;
  avatarUrl: string;
  emailVerificationState: "verified" | "unverified" | "unsupported";
  token: { token: string };
  original: { login: string };
}

function normalizeGitHubId(value: unknown): string {
  if (
    !(
      (typeof value === "number" && Number.isSafeInteger(value) && value > 0) ||
      (typeof value === "string" && /^\d{1,20}$/.test(value) && BigInt(value) > 0n)
    )
  ) {
    throw new Exception("GitHub identity is missing or invalid", { status: 400 });
  }
  return BigInt(value as number | string).toString();
}

export default class AuthService {
  static async findOrCreateFromGitHub(driverUser: GitHubDriverUser): Promise<User> {
    const githubUserId = normalizeGitHubId(driverUser.id);
    const verified = driverUser.emailVerificationState === "verified";
    const email = driverUser.email?.trim().toLowerCase() || null;
    // An unverified email is never persisted or used to claim an account.
    const verifiedEmail = verified ? email : null;

    return db.transaction(async (trx) => {
      // Serializes concurrent first logins of one identity only.
      await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", [
        `gitify:auth:identity:${githubUserId}`,
      ]);

      let user = await User.query({ client: trx })
        .where("githubUserId", githubUserId)
        .forUpdate()
        .first();

      if (user) {
        // Take the new verified email only when free; a collision keeps the stored one.
        // No row lock on the other holder: crossed email changes must not deadlock.
        const taken =
          verifiedEmail &&
          (await User.query({ client: trx })
            .whereRaw("lower(email) = ?", [verifiedEmail])
            .whereNot("id", user.id)
            .first());
        if (verifiedEmail && !taken) {
          user.merge({ email: verifiedEmail, isVerified: true });
        }
      } else {
        if (!verifiedEmail) {
          throw new Exception("A verified GitHub email is required to create or link an account", {
            status: 403,
          });
        }
        // A verified GitHub email is enough to link a legacy account.
        // Locking the legacy row makes a concurrent claim by another identity see the link.
        user =
          (await User.query({ client: trx })
            .whereRaw("lower(email) = ?", [verifiedEmail])
            .forUpdate()
            .first()) ?? new User();
        if (user.githubUserId) {
          throw new Exception("This email already belongs to another GitHub identity", {
            status: 409,
          });
        }
        user.merge({
          githubUserId,
          email: user.$isPersisted ? user.email : verifiedEmail,
          isVerified: true,
        });
      }

      user.useTransaction(trx);
      user.merge({
        name: driverUser.name ?? driverUser.original.login,
        avatarUrl: driverUser.avatarUrl,
        githubAccessToken: driverUser.token.token,
      });
      await user.save();
      return user;
    });
  }
}
