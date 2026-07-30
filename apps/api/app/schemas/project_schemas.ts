import { ApiProperty, ApiPropertyOptional } from "@foadonis/openapi/decorators";

export class ShowcaseContributorDto {
  @ApiProperty({ description: "Identifiant GitHub", example: "torvalds" })
  declare login: string;

  @ApiProperty({
    description: "URL de l'avatar GitHub",
    example: "https://avatars.githubusercontent.com/u/1024025",
  })
  declare avatarUrl: string;

  @ApiProperty({ description: "URL du profil GitHub", example: "https://github.com/torvalds" })
  declare profileUrl: string;
}

export class ShowcaseProjectDto {
  @ApiProperty({ description: "Identifiant ULID", example: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })
  declare id: string;

  @ApiProperty({ description: "Nom du dépôt", example: "linux" })
  declare name: string;

  @ApiProperty({ description: "Propriétaire du dépôt", example: "torvalds" })
  declare ownerName: string;

  @ApiProperty({ description: "URL du dépôt GitHub", example: "https://github.com/torvalds/linux" })
  declare repositoryUrl: string;

  @ApiPropertyOptional({ nullable: true, description: "Description du dépôt" })
  declare description: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Langage principal", example: "C" })
  declare language: string | null;

  @ApiProperty({ description: "Nombre d'étoiles", example: 195000 })
  declare stars: number;

  @ApiPropertyOptional({
    nullable: true,
    description: "Tag de la dernière version",
    example: "v6.12",
  })
  declare latestRelease: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage de dernière modification ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare updatedAt: string | null;

  @ApiProperty({
    type: [String],
    description: "Sujets du dépôt",
    example: ["kernel", "linux", "os"],
  })
  declare topics: string[];

  @ApiPropertyOptional({
    nullable: true,
    description: "Nombre total de contributeurs",
    example: 25000,
  })
  declare totalContributorsCount: number | null;

  @ApiProperty({ type: () => [ShowcaseContributorDto], description: "Principaux contributeurs" })
  declare contributors: ShowcaseContributorDto[];
}

export class ShowcaseLanguageResultDto {
  @ApiProperty({ description: "Langage de programmation", example: "TypeScript" })
  declare language: string;

  @ApiProperty({ type: () => [ShowcaseProjectDto] })
  declare projects: ShowcaseProjectDto[];
}

export class ShowcaseResponseDto {
  @ApiProperty({
    type: () => [ShowcaseLanguageResultDto],
    description: "Projets regroupés par langage",
  })
  declare languages: ShowcaseLanguageResultDto[];
}

export class ProjectDto {
  @ApiProperty({ description: "Identifiant ULID", example: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })
  declare id: string;

  @ApiProperty({ description: "Le projet est dans les favoris de l'utilisateur", example: false })
  declare isFavorite: boolean;

  @ApiProperty({ description: "Nom du dépôt", example: "core" })
  declare name: string;

  @ApiProperty({ description: "Propriétaire du dépôt", example: "adonisjs" })
  declare ownerName: string;

  @ApiPropertyOptional({ nullable: true, description: "Description du dépôt" })
  declare description: string | null;

  @ApiProperty({ description: "URL du dépôt GitHub", example: "https://github.com/adonisjs/core" })
  declare repositoryUrl: string;

  @ApiProperty({ description: "Nombre d'étoiles", example: 12000 })
  declare stars: number;

  @ApiPropertyOptional({ nullable: true, description: "Langage principal", example: "TypeScript" })
  declare language: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: [String],
    description: "Sujets du dépôt",
    example: ["nodejs", "framework"],
  })
  declare topics: string[] | null;

  @ApiProperty({ description: "Nombre d'issues ouvertes", example: 42 })
  declare openIssuesCount: number;

  @ApiProperty({
    enum: ["beginner", "expert"],
    description: "Niveau de difficulté",
    example: "beginner",
  })
  declare difficulty: string;

  @ApiProperty({ description: "Nombre de forks", example: 850 })
  declare forksCount: number;

  @ApiPropertyOptional({
    nullable: true,
    description: "Nombre total de contributeurs",
    example: 180,
  })
  declare totalContributorsCount: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Tag de la dernière version",
    example: "v6.1.0",
  })
  declare latestRelease: string | null;

  @ApiPropertyOptional({ nullable: true, description: "README au format Markdown" })
  declare readme: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Répartition des langages en octets",
    example: { TypeScript: 145000, JavaScript: 3200 },
  })
  declare languages: Record<string, number> | null;

  @ApiProperty({ description: "Identifiant numérique interne GitHub du dépôt", example: 12345678 })
  declare githubRepoId: number;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage ISO 8601 du dernier chargement des détails GitHub",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare detailsFetchedAt: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage de création ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare createdAt: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage de dernière modification ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare updatedAt: string | null;
}

export class ContributorDetailDto {
  @ApiProperty({ description: "Identifiant ULID", example: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })
  declare id: string;

  @ApiProperty({ description: "Identifiant GitHub", example: "contributor" })
  declare login: string;

  @ApiProperty({
    description: "URL de l'avatar",
    example: "https://avatars.githubusercontent.com/u/789",
  })
  declare avatarUrl: string;

  @ApiProperty({ description: "URL du profil", example: "https://github.com/contributor" })
  declare profileUrl: string;

  @ApiPropertyOptional({ nullable: true, description: "Nombre de contributions", example: 57 })
  declare contributions: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Identifiant numérique interne GitHub de l'utilisateur",
    example: 789123,
  })
  declare githubUserId: number | null;

  @ApiPropertyOptional({ nullable: true, description: "Identifiant ULID du projet associé" })
  declare projectId: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage de création ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare createdAt: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Horodatage de dernière modification ISO 8601",
    example: "2024-01-01T00:00:00.000Z",
  })
  declare updatedAt: string | null;
}

export class ProjectDetailDto extends ProjectDto {
  @ApiProperty({ type: () => [ContributorDetailDto], description: "Contributeurs du dépôt" })
  declare contributors: ContributorDetailDto[];
}

export class PaginationMetaDto {
  @ApiProperty({ description: "Nombre total d'éléments", example: 100 })
  declare total: number;

  @ApiProperty({ description: "Éléments par page", example: 20 })
  declare perPage: number;

  @ApiProperty({ description: "Numéro de page courante", example: 1 })
  declare currentPage: number;

  @ApiProperty({ description: "Numéro de la dernière page", example: 5 })
  declare lastPage: number;
}

export class ShowProjectResponseDto {
  @ApiProperty({ type: () => ProjectDetailDto })
  declare project: ProjectDetailDto;
}

export class FeedResponseDto {
  @ApiProperty({ type: () => [ProjectDto] })
  declare projects: ProjectDto[];

  @ApiProperty({
    description: "Nombre de projets correspondant aux préférences",
    example: 243,
  })
  declare available: number;
}

export class FavoriteProjectsResponseDto {
  @ApiProperty({ type: () => [ProjectDto] })
  declare projects: ProjectDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  declare meta: PaginationMetaDto;
}

export class FavoriteResponseDto {
  @ApiProperty({ description: "État du favori après l'opération", example: true })
  declare isFavorite: boolean;
}

export class NotFoundResponseDto {
  @ApiProperty({ description: "Message d'erreur", example: "Project not found" })
  declare error: string;
}

export class BadRequestResponseDto {
  @ApiProperty({ description: "Message d'erreur", example: "User preferences not set" })
  declare error: string;
}
