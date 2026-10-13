export class GitHubError extends Error {}

export class GitHubApiError extends GitHubError {
  constructor(
    readonly status: number,
    statusText = "",
  ) {
    super(`GitHub API error: ${status} ${statusText}`.trim());
  }
}

export class GitHubAuthError extends GitHubApiError {}

export class GitHubNotFoundError extends GitHubApiError {}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    status: number,
    readonly resetAt: Date | null,
    statusText = "",
  ) {
    super(status, statusText);
  }
}

export class GitHubUnavailableError extends GitHubError {
  constructor(
    readonly status: number | null,
    message = `GitHub API error: ${status}`,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class GitHubInvalidResponseError extends GitHubError {
  constructor(
    readonly resource: string,
    reason?: string,
  ) {
    super(`Invalid GitHub response: ${resource}${reason ? ` (${reason})` : ""}`);
  }
}

function rateLimitReset(headers: Headers, now: Date): Date | null {
  const reset = Number(headers.get("x-ratelimit-reset"));
  if (headers.get("x-ratelimit-remaining") === "0" && Number.isFinite(reset) && reset > 0) {
    return new Date(reset * 1000);
  }
  const retryAfter = Number(headers.get("retry-after"));
  if (headers.has("retry-after") && Number.isFinite(retryAfter)) {
    return new Date(now.getTime() + retryAfter * 1000);
  }
  return null;
}

export function errorFromResponse(response: Response, now: Date): GitHubError {
  const { status, statusText, headers } = response;
  if (status === 401) {
    return new GitHubAuthError(status, statusText);
  }
  if (status === 403 || status === 429) {
    const resetAt = rateLimitReset(headers, now);
    if (resetAt || status === 429) {
      return new GitHubRateLimitError(status, resetAt, statusText);
    }
    return new GitHubAuthError(status, statusText);
  }
  if (status === 404) {
    return new GitHubNotFoundError(status, statusText);
  }
  if (status >= 500) {
    return new GitHubUnavailableError(status, `GitHub API error: ${status} ${statusText}`.trim());
  }
  return new GitHubApiError(status, statusText);
}
