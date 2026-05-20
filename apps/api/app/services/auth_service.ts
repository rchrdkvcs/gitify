import User from "#models/user";

interface GitHubDriverUser {
  email: string;
  name: string | null;
  avatarUrl: string;
  emailVerificationState: "verified" | "unverified" | "unsupported";
  token: { token: string };
  original: { login: string };
}

export default class AuthService {
  static async findOrCreateFromGitHub(driverUser: GitHubDriverUser): Promise<User> {
    return User.updateOrCreate(
      { email: driverUser.email },
      {
        name: driverUser.name ?? driverUser.original.login,
        avatarUrl: driverUser.avatarUrl,
        githubAccessToken: driverUser.token.token,
        isVerified: driverUser.emailVerificationState === "verified",
      },
    );
  }
}
