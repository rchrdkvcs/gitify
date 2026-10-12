import type { HasMany } from "@adonisjs/lucid/types/relations";
import { beforeCreate, column, hasMany } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { Difficulty, NewcomerScore, RepositoryInsights } from "#shared/types/index";
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

  @column({
    prepare: (value: RepositoryInsights | null) => (value ? JSON.stringify(value) : null),
  })
  declare insights: RepositoryInsights | null;

  @column({
    prepare: (value: NewcomerScore | null) => (value ? JSON.stringify(value) : null),
  })
  declare newcomerScoreDetails: NewcomerScore | null;

  /** GitHub serves its own avatar URL; owners imported before it was stored use the public alias. */
  get avatarUrl(): string {
    return this.ownerAvatarUrl ?? `https://github.com/${this.ownerName}.png?size=96`;
  }

  @hasMany(() => Contributor)
  declare contributors: HasMany<typeof Contributor>;
}
