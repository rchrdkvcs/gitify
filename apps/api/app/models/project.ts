import type { HasMany } from "@adonisjs/lucid/types/relations";
import Contributor from "#models/contributor";
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
  declare openIssuesCount: number;

  @column()
  declare difficulty: "beginner" | "expert";

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
  })
  declare topics: string[] | null;

  @column()
  declare forksCount: number;

  @column()
  declare totalContributorsCount: number | null;

  @column()
  declare latestRelease: string | null;

  @column()
  declare readme: string | null;

  @column({
    prepare: (value: Record<string, number> | null) => (value ? JSON.stringify(value) : null),
  })
  declare languages: Record<string, number> | null;

  @column.dateTime()
  declare detailsFetchedAt: DateTime | null;

  @hasMany(() => Contributor)
  declare contributors: HasMany<typeof Contributor>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
