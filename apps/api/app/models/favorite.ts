import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Project from "#models/project";
import User from "#models/user";
import { BaseModel, column, belongsTo } from "@adonisjs/lucid/orm";
import { type DateTime } from "luxon";

export default class Favorite extends BaseModel {
  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare userId: string;

  @column()
  declare projectId: string;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
