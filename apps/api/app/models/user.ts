import { UserSchema } from "#database/schema";
import { column } from "@adonisjs/lucid/orm";

export type UserPreferences = {
  difficulty: "beginner" | "expert";
  languages: string[];
};

export default class User extends UserSchema {
  @column()
  declare preferences: UserPreferences | null;
}
