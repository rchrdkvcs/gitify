import { DateTime } from "luxon";
import type User from "#models/user";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { PreferenceLanguage } from "#shared/preferences";
import type { UserPreferences } from "#shared/types/index";
import GitHubApiClient from "#services/github/github_api_client";
import { defaultUserPreferences, inferPreferredLanguages } from "#shared/preferences";

/** Questions of the guided onboarding, in order; the finish screen follows the last one. */
export const onboardingSteps = ["level", "contributionTypes", "languages", "topics"] as const;

export type OnboardingProgress = Partial<UserPreferences> & { step: number };

export class OnboardingService {
  constructor(
    private readonly github: Pick<GitHubAdapter, "listUserRepositoryLanguages"> = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  /** Finished or explicitly skipped onboardings never interrupt a login again. */
  landingPath(user: Pick<User, "onboardedAt" | "onboardingSkippedAt">): string {
    return user.onboardedAt || user.onboardingSkippedAt ? "/explore" : "/onboarding";
  }

  /** Question to show first: the next unanswered one, or the first one to review answers. */
  resumeStep(user: Pick<User, "onboardedAt" | "onboardingStep">): number {
    if (user.onboardedAt) {
      return 1;
    }
    return Math.min(Math.max(user.onboardingStep ?? 0, 0) + 1, onboardingSteps.length);
  }

  /** Each confirmed answer is kept immediately, so leaving halfway loses nothing. */
  async saveProgress(user: User, { step, ...answers }: OnboardingProgress): Promise<void> {
    const defined = Object.fromEntries(
      Object.entries(answers).filter(([, value]) => value !== undefined),
    );
    user.preferences = { ...(user.preferences ?? defaultUserPreferences), ...defined };
    // A freshly created model has not read the column default back yet.
    user.onboardingStep = Math.max(user.onboardingStep ?? 0, step);
    await user.save();
  }

  async complete(user: User, preferences: UserPreferences): Promise<void> {
    user.preferences = preferences;
    user.onboardingStep = onboardingSteps.length;
    user.onboardedAt ??= this.now();
    await user.save();
  }

  async skip(user: User): Promise<void> {
    user.onboardingSkippedAt = this.now();
    await user.save();
  }

  /**
   * Languages pre-selected from the user's own repositories. Only offered while the user has
   * not chosen languages; GitHub failures simply mean no suggestion.
   */
  async suggestLanguages(user: User): Promise<PreferenceLanguage[]> {
    if (!user.githubAccessToken || user.preferences?.languages.length) {
      return [];
    }
    try {
      return inferPreferredLanguages(
        await this.github.listUserRepositoryLanguages(user.githubAccessToken),
      );
    } catch (error) {
      console.error(`Language suggestions failed for user ${user.id}:`, error);
      return [];
    }
  }
}

export default new OnboardingService();
