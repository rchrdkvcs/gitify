import type { HasMany } from "@adonisjs/lucid/types/relations";

import Favorite from "#models/favorite";
import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm";
import { type DateTime } from "luxon";

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare githubRepoId: number;

  @column()
  declare ownerName: string;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare repositoryUrl: string;

  @column()
  declare stars: number;

  @column()
  declare language: string | null;

  @column()
  declare topics: string[] | null;

  @hasMany(() => Favorite)
  declare favorites: HasMany<typeof Favorite>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
