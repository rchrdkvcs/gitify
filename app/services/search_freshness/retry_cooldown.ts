import { DateTime } from "luxon";
import gitifyConfig from "#config/gitify";
import { GitHubRateLimitError } from "#services/github/github_errors";

export function retryAfterFailure(
  error: unknown,
  now: DateTime,
  fallbackSeconds: number = gitifyConfig.cache.searchRetrySeconds,
): DateTime {
  if (error instanceof GitHubRateLimitError && error.resetAt) {
    const reset = DateTime.fromJSDate(error.resetAt);
    if (reset > now) {
      return reset;
    }
  }
  return now.plus({ seconds: fallbackSeconds });
}
