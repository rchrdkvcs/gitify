import type { HttpContext } from "@adonisjs/core/http";
import { UserDto, LogoutResponseDto, UnauthorizedResponseDto } from "#schemas/user_schemas";
import AuthService from "#services/auth_service";
import env from "#start/env";
import UserTransformer from "#transformers/user_transformer";
import {
  ApiCookieAuth,
  ApiExcludeOperation,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@foadonis/openapi/decorators";

@ApiTags("Auth")
export default class AuthController {
  @ApiExcludeOperation()
  async redirect({ ally }: HttpContext) {
    return ally.use("github").redirect();
  }

  @ApiExcludeOperation()
  async callback({ ally, response, auth }: HttpContext) {
    const githubDrive = ally.use("github");

    if (githubDrive.accessDenied()) {
      return response.badRequest("Access Denied: You cancelled the login request.");
    }
    if (githubDrive.stateMisMatch()) {
      return response.badRequest("State Mismatch: Session expired or invalid.");
    }
    if (githubDrive.hasError()) {
      return response.badRequest(`GitHub Error: ${githubDrive.getError()}`);
    }

    const driverUser = await githubDrive.user();
    const user = await AuthService.findOrCreateFromGitHub(driverUser);

    await auth.use("web").login(user);

    if (!user.preferences) {
      return response.redirect(`${env.get("FRONTEND_URL")}/preferences`);
    } else {
      return response.redirect(env.get("FRONTEND_URL"));
    }
  }

  @ApiOperation({
    summary: "Utilisateur courant",
    description: "Retourne le profil de l'utilisateur authentifié.",
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    type: () => UserDto,
    description: "Profil de l'utilisateur authentifié",
  })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async me({ auth, serialize }: HttpContext) {
    return await serialize.withoutWrapping(UserTransformer.transform(auth.getUserOrFail()));
  }

  @ApiOperation({ summary: "Déconnexion", description: "Invalide le cookie de session courant." })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: () => LogoutResponseDto, description: "Session invalidée" })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  async logout({ auth, response }: HttpContext) {
    await auth.use("web").logout();
    return response.ok({ message: "Successfully logged out" });
  }
}
