import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { AccessToken } from '@adonisjs/auth/access_tokens'
import Project from '#models/project'
import Favorite from '#models/favorite'

/**
 * Structure defining user preferences for project matching.
 */
export type UserPreferences = {
  difficulty: 'beginner' | 'expert'
  languages: string[]
}

/**
 * User Model
 * Represents a registered user in the PostgreSQL database.
 * Handles authentication via AdonisJS Native Opaque Tokens and
 * tracks relationships with Projects and Favorites (Matches).
 */
export default class User extends BaseModel {
  // Integrates the database-backed access token provider for this model
  static accessTokens = DbAccessTokensProvider.forModel(User)

  // Injected by the Auth guard during a request when a user is authenticated
  declare currentAccessToken: AccessToken

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare accessToken: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare isVerified: boolean

  @column()
  declare avatarUrl: string | null

  @column()
  declare preferences: UserPreferences | null

  // A user can own multiple projects
  @hasMany(() => Project, { foreignKey: 'ownerId' })
  declare projects: HasMany<typeof Project>

  // A user can swipe right (favorite) multiple projects
  @hasMany(() => Favorite)
  declare favorites: HasMany<typeof Favorite>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
