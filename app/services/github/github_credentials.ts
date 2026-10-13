import type User from "#models/user";

export type GitHubReaderSource = "user" | "server" | "none";

export type GitHubReader = {
  userId: string | null;
  token: string | null;
  source: GitHubReaderSource;
};

type SignedInUser = Pick<User, "id" | "githubAccessToken">;

export default class GitHubCredentials {
  private readonly serverToken: string | null;

  constructor(serverToken: string | null | undefined) {
    this.serverToken = serverToken || null;
  }

  readerFor(user: SignedInUser | null | undefined): GitHubReader {
    if (user?.githubAccessToken) {
      return { userId: user.id, token: user.githubAccessToken, source: "user" };
    }
    return { ...this.server(), userId: user?.id ?? null };
  }

  server(): GitHubReader {
    return this.serverToken
      ? { userId: null, token: this.serverToken, source: "server" }
      : { userId: null, token: null, source: "none" };
  }

  fallbackFor(token: string): string | null {
    return this.serverToken && token !== this.serverToken ? this.serverToken : null;
  }
}
