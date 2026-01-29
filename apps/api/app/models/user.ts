import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import Favorite from '#models/favorite'

export type UserPreferences = {
  difficulty: 'beginner' | 'expert'
  languages: string[]
}

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'github_id' })
  declare githubId: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column()
  declare preferences: UserPreferences | null

  @hasMany(() => Project, { foreignKey: 'ownerId' })
  declare projects: HasMany<typeof Project>

  @hasMany(() => Favorite)
  declare favorites: HasMany<typeof Favorite>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
