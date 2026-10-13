import db from "@adonisjs/lucid/services/db";
import OAuthCallbackException from "#exceptions/oauth_callback_exception";
import User from "#models/user";

interface GitHubDriverUser {
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
    throw new OAuthCallbackException("invalid_identity");
  }
  return BigInt(value as number | string).toString();
}

export default class AuthService {
  async findOrCreateFromGitHub(driverUser: GitHubDriverUser): Promise<User> {
    const githubUserId = normalizeGitHubId(driverUser.id);
    const verified = driverUser.emailVerificationState === "verified";
    const email = driverUser.email?.trim().toLowerCase() || null;
    const verifiedEmail = verified ? email : null;

    return db.transaction(async (trx) => {
      await trx.rawQuery("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", [
        `gitify:auth:identity:${githubUserId}`,
      ]);

      let user = await User.query({ client: trx })
        .where("githubUserId", githubUserId)
        .forUpdate()
        .first();

      if (user) {
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
          throw new OAuthCallbackException("missing_verified_email");
        }
        user =
          (await User.query({ client: trx })
            .whereRaw("lower(email) = ?", [verifiedEmail])
            .forUpdate()
            .first()) ?? new User();
        if (user.githubUserId) {
          throw new OAuthCallbackException("identity_conflict");
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
