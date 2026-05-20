import { ApiProperty, ApiPropertyOptional } from "@foadonis/openapi/decorators";

export class UserPreferencesDto {
  @ApiProperty({
    enum: ["beginner", "expert"],
    description: "Niveau de difficulté préféré",
    example: "beginner",
  })
  declare difficulty: string;

  @ApiProperty({
    type: [String],
    description: "Langages de programmation préférés",
    example: ["TypeScript", "Python"],
  })
  declare languages: string[];
}

export class UserDto {
  @ApiProperty({ description: "Identifiant ULID", example: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })
  declare id: string;

  @ApiProperty({ description: "Adresse e-mail", example: "utilisateur@exemple.com" })
  declare email: string;

  @ApiPropertyOptional({ nullable: true, description: "Nom d'affichage", example: "Jean Dupont" })
  declare name: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "URL de l'avatar GitHub",
    example: "https://avatars.githubusercontent.com/u/123456",
  })
  declare avatarUrl: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Indique si le compte GitHub est vérifié" })
  declare isVerified: boolean | null;

  @ApiPropertyOptional({
    nullable: true,
    type: () => UserPreferencesDto,
    description: "Préférences du fil de projets",
  })
  declare preferences: UserPreferencesDto | null;

  @ApiProperty({
    description: "Horodatage de création ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare createdAt: string;

  @ApiProperty({
    description: "Horodatage de dernière modification ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare updatedAt: string;
}

export class UpdatePreferencesBodyDto {
  @ApiProperty({
    enum: ["beginner", "expert"],
    description: "Niveau de difficulté préféré",
    example: "beginner",
  })
  declare difficulty: string;

  @ApiProperty({
    type: [String],
    description: "Au moins un langage de programmation",
    example: ["TypeScript", "Python"],
  })
  declare languages: string[];
}

export class LogoutResponseDto {
  @ApiProperty({ description: "Message de succès", example: "Successfully logged out" })
  declare message: string;
}

export class UpdatePreferencesResponseDto {
  @ApiProperty({ description: "Message de succès", example: "Preferences updated successfully" })
  declare message: string;

  @ApiProperty({ type: () => UserDto })
  declare user: UserDto;
}

export class UnauthorizedResponseDto {
  @ApiProperty({ description: "Message d'erreur", example: "Unauthorized access" })
  declare message: string;
}
