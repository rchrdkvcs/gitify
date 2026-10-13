import { beforeCreate, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { UserPreferences } from "#shared/types/index";
import { UserSchema } from "#database/schema";
import { normalizeUserPreferences } from "#shared/preferences";

export type { UserPreferences };

export default class User extends UserSchema {
  @beforeCreate()
  static generateId(user: User) {
    user.id = ulid();
  }

  // Rows written before the onboarding rework hold `{ difficulty, languages }`.
  @column({
    consume: (value: unknown) => normalizeUserPreferences(value),
    prepare: (value: UserPreferences | null) => (value ? JSON.stringify(value) : null),
  })
  declare preferences: UserPreferences | null;
}
