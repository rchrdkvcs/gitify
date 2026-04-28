import type { HasMany } from "@adonisjs/lucid/types/relations";
import { ProjectSchema } from "#database/schema";
import Contributor from "#models/contributor";
import { beforeCreate, column, hasMany } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export default class Project extends ProjectSchema {
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
