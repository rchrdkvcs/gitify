import type { HttpContext } from "@adonisjs/core/http";
import ProjectFeedService from "#services/project_feed_service";
import env from "#start/env";
import { projectIdValidator } from "#validators/project_id_validator";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@foadonis/openapi/decorators";
import {
  BadRequestResponseDto,
  FeedResponseDto,
  InteractionResponseDto,
  LikedProjectsResponseDto,
  NotFoundResponseDto,
  ShowcaseResponseDto,
  ShowProjectResponseDto,
} from "#schemas/project_schemas";
import { UnauthorizedResponseDto } from "#schemas/user_schemas";

@ApiTags("Projects")
export default class ProjectController {
  @ApiOperation({
    summary: "Vitrine",
    description:
      "Retourne une sélection de projets open-source populaires regroupés par langage. Aucune authentification requise.",
  })
  @ApiResponse({ status: 200, type: () => ShowcaseResponseDto, description: "Projets regroupés par langage" })
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
  @ApiParam({ name: "id", description: "Identifiant numérique du projet", required: true, schema: { type: "integer" } })
  @ApiResponse({ status: 200, type: () => ShowProjectResponseDto, description: "Détail du projet" })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async show({ auth, response, request }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const user = auth.getUserOrFail();
    const project = await ProjectFeedService.getProject(params.id, user.githubAccessToken!);

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }

    return response.ok({ project });
  }

  @ApiOperation({
    summary: "Fil de projets",
    description:
      "Retourne une liste personnalisée de projets non vus en fonction des préférences de difficulté et de langages. Les préférences doivent être configurées au préalable (`PUT /auth/preferences`).",
  })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: () => FeedResponseDto, description: "Fil de projets personnalisé" })
  @ApiResponse({ status: 400, type: () => BadRequestResponseDto, description: "Préférences utilisateur non définies" })
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
    summary: "Projets aimés",
    description: "Retourne une liste paginée des projets que l'utilisateur authentifié a aimés.",
  })
  @ApiCookieAuth()
  @ApiQuery({ name: "page", description: "Numéro de page (défaut : 1)", required: false, schema: { type: "integer", minimum: 1 } })
  @ApiResponse({ status: 200, type: () => LikedProjectsResponseDto, description: "Liste paginée des projets aimés" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async liked({ auth, request, response }: HttpContext) {
    const page = Math.max(1, Number(request.qs().page ?? 1));
    const interactions = await ProjectFeedService.getLikedProjects(auth.user!.id, page);

    return response.ok({
      projects: interactions.all().map((i) => i.project),
      meta: interactions.getMeta(),
    });
  }

  @ApiOperation({
    summary: "Aimer un projet",
    description:
      "Enregistre une interaction 'aimé' pour le projet donné. Remplace toute interaction 'ignoré' précédente.",
  })
  @ApiCookieAuth()
  @ApiParam({ name: "id", description: "Identifiant numérique du projet", required: true, schema: { type: "integer" } })
  @ApiResponse({ status: 200, type: () => InteractionResponseDto, description: "Interaction enregistrée" })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async like({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.recordInteraction(auth.user!.id, params.id, "liked");

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ type: "liked" });
  }

  @ApiOperation({
    summary: "Ignorer un projet",
    description:
      "Enregistre une interaction 'ignoré' pour le projet donné. Remplace toute interaction 'aimé' précédente.",
  })
  @ApiCookieAuth()
  @ApiParam({ name: "id", description: "Identifiant numérique du projet", required: true, schema: { type: "integer" } })
  @ApiResponse({ status: 200, type: () => InteractionResponseDto, description: "Interaction enregistrée" })
  @ApiResponse({ status: 404, type: () => NotFoundResponseDto, description: "Projet introuvable" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async pass({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(projectIdValidator);
    const project = await ProjectFeedService.recordInteraction(auth.user!.id, params.id, "passed");

    if (!project) {
      return response.notFound({ error: "Project not found" });
    }
    return response.ok({ type: "passed" });
  }
}
