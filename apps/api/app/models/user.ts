import { UserSchema } from "#database/schema";
import { beforeCreate, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export type UserPreferences = {
  difficulty: "beginner" | "expert";
  languages: string[];
};

export default class User extends UserSchema {
  @beforeCreate()
  static generateId(user: User) {
    user.id = ulid();
  }

  @column()
  declare preferences: UserPreferences | null;
}
