import logger from "@adonisjs/core/services/logger";
import { DateTime } from "luxon";
import type User from "#models/user";
import type { GitHubAdapter } from "#services/github/github_adapter";
import type { GitHubReader } from "#services/github/github_credentials";
import type { PreferenceLanguage } from "#shared/preferences";
import type { UserPreferences } from "#shared/types/index";
import { inferPreferredLanguages } from "#shared/language_inference";
import {
  lastOnboardingStep,
  recordOnboardingAnswer,
  type OnboardingProgress,
  type OnboardingRecord,
} from "#shared/onboarding";
import { defaultUserPreferences } from "#shared/preferences";

export default class OnboardingService {
  constructor(
    private readonly github: Pick<GitHubAdapter, "listUserRepositoryLanguages">,
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

  async suggestLanguages(
    user: Pick<User, "preferences">,
    reader: GitHubReader,
  ): Promise<PreferenceLanguage[]> {
    if (reader.source !== "user" || !reader.token || user.preferences?.languages.length) {
      return [];
    }
    try {
      return inferPreferredLanguages(await this.github.listUserRepositoryLanguages(reader.token));
    } catch (error) {
      logger.warn({ err: error, userId: reader.userId }, "Language suggestions failed");
      return [];
    }
  }

  private async persist(user: User, record: OnboardingRecord): Promise<void> {
    user.preferences = record.preferences;
    user.onboardingStep = record.answeredSteps;
    await user.save();
  }
}
