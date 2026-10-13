import gitifyConfig from "#config/gitify";
import {
  GitHubInvalidResponseError,
  GitHubRateLimitError,
  GitHubUnavailableError,
  errorFromResponse,
} from "#services/github/github_errors";

export type GitHubOutcome = "absent" | "empty" | "pending";

export type GitHubReply =
  | { kind: "data"; data: unknown; headers: Headers }
  | { kind: GitHubOutcome };

export type GitHubRequest = {
  token: string;
  accept?: string;
  body?: unknown;
  outcomes?: Partial<Record<number, GitHubOutcome>>;
};

type GraphQLPayload = {
  data?: Record<string, unknown> | null;
  errors?: { type?: string; message?: string }[];
};

export class GitHubTransport {
  constructor(
    private readonly request: typeof fetch = globalThis.fetch,
    private readonly timeoutMs = 10_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async send(url: string, options: GitHubRequest): Promise<GitHubReply> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        const error = new GitHubUnavailableError(null, "GitHub request timed out");
        controller.abort(error);
        reject(error);
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([this.exchange(url, options, controller.signal), deadline]);
    } finally {
      clearTimeout(timeout);
    }
  }

  async data(url: string, options: GitHubRequest): Promise<{ data: unknown; headers: Headers }> {
    const reply = await this.send(url, options);
    if (reply.kind !== "data") {
      throw new GitHubInvalidResponseError(url, reply.kind);
    }
    return reply;
  }

  async graphql<T>(
    request: { document: string; variables: Record<string, unknown>; token: string },
    resource: string,
    select: (data: Record<string, unknown>) => T | null | undefined,
  ): Promise<T> {
    const { data, headers } = await this.data(gitifyConfig.github.graphqlUrl, {
      token: request.token,
      body: { query: request.document, variables: request.variables },
    });
    const payload = data as GraphQLPayload | null;
    const error = payload?.errors?.[0];
    if (error?.type === "RATE_LIMITED") {
      const reset = Number(headers.get("x-ratelimit-reset"));
      throw new GitHubRateLimitError(200, reset > 0 ? new Date(reset * 1000) : null);
    }
    const selected = payload?.data ? select(payload.data) : null;
    if (selected === null || selected === undefined) {
      throw new GitHubInvalidResponseError(resource, error?.message ?? `missing ${resource}`);
    }
    return selected;
  }

  private async exchange(
    url: string,
    { token, accept, body, outcomes = {} }: GitHubRequest,
    signal: AbortSignal,
  ): Promise<GitHubReply> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: accept ?? gitifyConfig.github.acceptHeader,
      "X-GitHub-Api-Version": gitifyConfig.github.apiVersion,
    };
    const init: RequestInit =
      body === undefined
        ? { headers, signal }
        : {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal,
          };
    let response: Response;
    try {
      response = await this.request(url, init);
    } catch (error) {
      throw new GitHubUnavailableError(null, "GitHub request failed", { cause: error });
    }
    const outcome = outcomes[response.status];
    if (outcome) {
      await response.body?.cancel();
      return { kind: outcome };
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw errorFromResponse(response, this.now());
    }
    if (response.status === 204) {
      throw new GitHubInvalidResponseError(url, "empty body");
    }
    try {
      return { kind: "data", data: await response.json(), headers: response.headers };
    } catch (error) {
      if (signal.aborted) {
        throw signal.reason;
      }
      throw new GitHubInvalidResponseError(url, (error as Error).message);
    }
  }
}
