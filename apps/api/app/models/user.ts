import type { UserPreferences } from "@gitify/types";
import { UserSchema } from "#database/schema";
import { beforeCreate, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export type { UserPreferences };

export default class User extends UserSchema {
  @beforeCreate()
  static generateId(user: User) {
    user.id = ulid();
  }

  @column()
  declare preferences: UserPreferences | null;
}
