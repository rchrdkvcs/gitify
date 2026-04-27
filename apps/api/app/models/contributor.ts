import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import type { DateTime } from "luxon";
import Project from "#models/project";
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";

export default class Contributor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare projectId: number;

  @column()
  declare githubUserId: number;

  @column()
  declare login: string;

  @column()
  declare avatarUrl: string;

  @column()
  declare profileUrl: string;

  @column()
  declare contributions: number;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
