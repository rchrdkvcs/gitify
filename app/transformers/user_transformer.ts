import { BaseTransformer } from "@adonisjs/core/transformers";
import type User from "#models/user";
import type { AuthUser } from "#shared/types/index";

export default class UserTransformer extends BaseTransformer<User> {
  toObject(): AuthUser {
    const user = this.resource;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      preferences: user.preferences,
      onboardedAt: user.onboardedAt?.toISO() ?? null,
      onboardingSkippedAt: user.onboardingSkippedAt?.toISO() ?? null,
      onboardingStep: user.onboardingStep,
      createdAt: user.createdAt?.toISO() ?? null,
      updatedAt: user.updatedAt?.toISO() ?? null,
    };
  }
}
