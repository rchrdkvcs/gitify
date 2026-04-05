import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import type { DateTime } from "luxon";

import Project from "#models/project";
import User from "#models/user";
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";

export default class UserProjectInteraction extends BaseModel {
  static table = "user_project_interactions";

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare projectId: number;

  @column()
  declare type: "liked" | "passed";

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
