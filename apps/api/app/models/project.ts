import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import Favorite from "#models/favorite";
import User from "#models/user";
import { BaseModel, column, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import { type DateTime } from "luxon";

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare repositoryUrl: string;

  @column()
  declare ownerId: number;

  @belongsTo(() => User, {
    foreignKey: "ownerId",
  })
  declare owner: BelongsTo<typeof User>;

  @hasMany(() => Favorite)
  declare favorites: HasMany<typeof Favorite>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
