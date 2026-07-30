import type { HttpContext } from "@adonisjs/core/http";
import {
  BadRequestResponseDto,
  FavoriteResponseDto,
  FavoriteProjectsResponseDto,
  FeedResponseDto,
  NotFoundResponseDto,
  ShowcaseResponseDto,
  ShowProjectResponseDto,
} from "#schemas/project_schemas";
import { UnauthorizedResponseDto } from "#schemas/user_schemas";
import ProjectFeedService from "#services/project_feed_service";
import env from "#start/env";
import { projectIdValidator } from "#validators/project_id_validator";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@foadonis/openapi/decorators";

@ApiTags("Projects")
export default class ProjectController {
  @ApiOperation({
    summary: "Vitrine",
    description:
      "Retourne une sélection de projets open-source populaires regroupés par langage. Aucune authentification requise.",
  })
  @ApiResponse({
    status: 200,
    type: () => ShowcaseResponseDto,
    description: "Projets regroupés par langage",
  })
  async showcase({ response }: HttpContext) {
    const serverToken = env.get("GITHUB_SERVER_TOKEN") ?? undefined;
    const languages = await ProjectFeedService.getShowcase(serverToken);
    return response.ok({ languages });
  }

  @ApiOperation({
    summary: "Obtenir un projet",
    description:
      "Retourne les détails complets d'un projet, incluant le README, la répartition des langages et les contributeurs.",
  })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: () => ShowProjectResponseDto, description: "Détail du projet" })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async show({ auth, response, request }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const user = auth.getUserOrFail();
    const project = await ProjectFeedService.getProject(
      params.id,
      user.id,
      user.githubAccessToken!,
    );

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    return response.ok({ project });
  }

  @ApiOperation({
    summary: "Fil de projets",
    description:
      "Retourne une liste personnalisée de projets en fonction des préférences de difficulté et de langages. Les préférences doivent être configurées au préalable (`PUT /auth/preferences`).",
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    type: () => FeedResponseDto,
    description: "Fil de projets personnalisé",
  })
  @ApiResponse({
    status: 400,
    type: () => BadRequestResponseDto,
    description: "Préférences utilisateur non définies",
  })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async feed({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail();

    if (!user.preferences) {
      return response.badRequest({ error: "User preferences not set" });
    }

    const result = await ProjectFeedService.getFeed(
      user.id,
      user.preferences,
      user.githubAccessToken!,
    );

    return response.ok(result);
  }

  @ApiOperation({
    summary: "Projets favoris",
    description: "Retourne une liste paginée des projets favoris de l'utilisateur authentifié.",
  })
  @ApiCookieAuth()
  @ApiQuery({
    name: "page",
    description: "Numéro de page (défaut : 1)",
    required: false,
    schema: { type: "integer", minimum: 1 },
  })
  @ApiResponse({
    status: 200,
    type: () => FavoriteProjectsResponseDto,
    description: "Liste paginée des projets favoris",
  })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async favorites({ auth, request, response }: HttpContext) {
    const page = Math.max(1, Number(request.qs().page ?? 1));
    const favorites = await ProjectFeedService.getFavoriteProjects(auth.user!.id, page);

    return response.ok({
      projects: favorites.all().map((favorite) => favorite.project),
      meta: favorites.getMeta(),
    });
  }

  @ApiOperation({
    summary: "Ajouter un projet aux favoris",
    description: "Ajoute le projet donné aux favoris de l'utilisateur authentifié.",
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    type: () => FavoriteResponseDto,
    description: "Favori enregistré",
  })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async addFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.addFavorite(auth.user!.id, params.id);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ isFavorite: true });
  }

  @ApiOperation({
    summary: "Retirer un projet des favoris",
    description: "Retire le projet donné des favoris de l'utilisateur authentifié.",
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    type: () => FavoriteResponseDto,
    description: "Favori supprimé",
  })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async removeFavorite({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.removeFavorite(auth.user!.id, params.id);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ isFavorite: false });
  }
}
