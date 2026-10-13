import logger from "@adonisjs/core/services/logger";
import { DateTime } from "luxon";
import type User from "#models/user";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { PreferenceLanguage } from "#shared/preferences";
import type { UserPreferences } from "#shared/types/index";
import GitHubApiClient from "#services/github/github_api_client";
import { defaultUserPreferences, inferPreferredLanguages } from "#shared/preferences";

export const onboardingSteps = ["level", "contributionTypes", "languages", "topics"] as const;

export type OnboardingProgress = Partial<UserPreferences> & { step: number };

export class OnboardingService {
  constructor(
    private readonly github: Pick<GitHubAdapter, "listUserRepositoryLanguages"> = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  landingPath(user: Pick<User, "onboardedAt" | "onboardingSkippedAt">): string {
    return user.onboardedAt || user.onboardingSkippedAt ? "/explore" : "/onboarding";
  }

  resumeStep(user: Pick<User, "onboardedAt" | "onboardingStep">): number {
    if (user.onboardedAt) {
      return 1;
    }
    return Math.min(Math.max(user.onboardingStep ?? 0, 0) + 1, onboardingSteps.length);
  }

  async saveProgress(user: User, { step, ...answers }: OnboardingProgress): Promise<void> {
    const defined = Object.fromEntries(
      Object.entries(answers).filter(([, value]) => value !== undefined),
    );
    user.preferences = { ...(user.preferences ?? defaultUserPreferences), ...defined };
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

  async suggestLanguages(user: User): Promise<PreferenceLanguage[]> {
    if (!user.githubAccessToken || user.preferences?.languages.length) {
      return [];
    }
    try {
      return inferPreferredLanguages(
        await this.github.listUserRepositoryLanguages(user.githubAccessToken),
      );
    } catch (error) {
      logger.warn({ err: error, userId: user.id }, "Language suggestions failed");
      return [];
    }
  }
}

export default new OnboardingService();
