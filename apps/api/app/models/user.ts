import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Type pour les préférences utilisateur stockées dans la colonne JSONB 'preferences'.
 */
export type UserPreferences = {
  difficulty: 'beginner' | 'expert'
  languages: string[]
}

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
