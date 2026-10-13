import logger from "@adonisjs/core/services/logger";
import { DateTime } from "luxon";
import type User from "#models/user";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { PreferenceLanguage } from "#shared/preferences";
import type { UserPreferences } from "#shared/types/index";
import GitHubApiClient from "#services/github/github_api_client";
import { inferPreferredLanguages } from "#shared/language_inference";
import {
  lastOnboardingStep,
  recordOnboardingAnswer,
  type OnboardingProgress,
  type OnboardingRecord,
} from "#shared/onboarding";
import { defaultUserPreferences } from "#shared/preferences";

export class OnboardingService {
  constructor(
    private readonly github: Pick<GitHubAdapter, "listUserRepositoryLanguages"> = GitHubApiClient,
    private readonly now: () => DateTime = () => DateTime.now(),
  ) {}

  landingPath(user: Pick<User, "onboardedAt" | "onboardingSkippedAt">): string {
    return user.onboardedAt || user.onboardingSkippedAt ? "/explore" : "/onboarding";
  }

  async saveAnswer(user: User, progress: OnboardingProgress): Promise<void> {
    const record = recordOnboardingAnswer(
      {
        preferences: user.preferences ?? defaultUserPreferences,
        answeredSteps: user.onboardingStep,
      },
      progress,
    );
    await this.persist(user, record);
  }

  async completeWith(user: User, preferences: UserPreferences): Promise<void> {
    user.onboardedAt ??= this.now();
    await this.persist(user, { preferences, answeredSteps: lastOnboardingStep });
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

  private async persist(user: User, record: OnboardingRecord): Promise<void> {
    user.preferences = record.preferences;
    user.onboardingStep = record.answeredSteps;
    await user.save();
  }
}

export default new OnboardingService();
