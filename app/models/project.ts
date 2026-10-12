import type { HasMany } from "@adonisjs/lucid/types/relations";
import { beforeCreate, column, hasMany } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { Difficulty } from "#shared/types/index";
import { ProjectSchema } from "#database/schema";
import Contributor from "#models/contributor";

export default class Project extends ProjectSchema {
  @column()
  declare difficulty: Difficulty;

  @beforeCreate()
  static generateId(model: Project) {
    model.id = ulid();
  }

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
  })
  declare topics: string[] | null;

  @column({
    prepare: (value: Record<string, number> | null) => (value ? JSON.stringify(value) : null),
  })
  declare languages: Record<string, number> | null;

  @hasMany(() => Contributor)
  declare contributors: HasMany<typeof Contributor>;
}
