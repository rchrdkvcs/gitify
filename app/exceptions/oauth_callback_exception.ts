import UserFacingException from "#exceptions/user_facing_exception";

const failures = {
  access_denied: {
    status: 400,
    message: "Connexion GitHub annulée.",
  },
  state_mismatch: {
    status: 400,
    message: "Ta session de connexion a expiré. Réessaie de te connecter.",
  },
  provider_error: {
    status: 502,
    message: "GitHub n'a pas pu valider ta connexion. Réessaie dans quelques instants.",
  },
  invalid_identity: {
    status: 400,
    message: "GitHub a renvoyé une identité invalide. Réessaie de te connecter.",
  },
  missing_verified_email: {
    status: 403,
    message: "Un email vérifié sur GitHub est nécessaire pour créer ou lier ton compte.",
  },
  identity_conflict: {
    status: 409,
    message: "Cet email est déjà associé à un autre compte GitHub.",
  },
} as const;

export type OAuthFailureReason = keyof typeof failures;

export default class OAuthCallbackException extends UserFacingException {
  constructor(
    readonly reason: OAuthFailureReason,
    options: { cause?: unknown } = {},
  ) {
    super(failures[reason].message, {
      status: failures[reason].status,
      code: `E_OAUTH_${reason.toUpperCase()}`,
      cause: options.cause,
    });
  }
}
