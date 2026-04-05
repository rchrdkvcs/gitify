import type { DateTime } from "luxon";

import { BaseModel, column } from "@adonisjs/lucid/orm";

export default class GithubFetchCache extends BaseModel {
  static table = "github_fetch_caches";

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare language: string;

  @column()
  declare difficulty: "beginner" | "expert";

  @column()
  declare totalStored: number;

  @column.dateTime()
  declare fetchedAt: DateTime;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
