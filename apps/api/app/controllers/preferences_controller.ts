import type { HttpContext } from "@adonisjs/core/http";
import {
  UnauthorizedResponseDto,
  UpdatePreferencesBodyDto,
  UpdatePreferencesResponseDto,
} from "#schemas/user_schemas";
import UserTransformer from "#transformers/user_transformer";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@foadonis/openapi/decorators";

@ApiTags("Preferences")
@ApiCookieAuth()
export default class PreferencesController {
  @ApiOperation({
    summary: "Mettre à jour les préférences",
    description:
      "Définit le niveau de difficulté et les langages de programmation utilisés pour personnaliser le fil de projets.",
  })
  @ApiBody({ type: () => UpdatePreferencesBodyDto, required: true })
  @ApiResponse({
    status: 200,
    type: () => UpdatePreferencesResponseDto,
    description: "Préférences enregistrées",
  })
  @ApiResponse({ status: 401, type: () => UnauthorizedResponseDto, description: "Non authentifié" })
  @ApiResponse({ status: 422, description: "Erreur de validation" })
  async update({ auth, request, response, serialize }: HttpContext) {
    const user = auth.user!;

    user.preferences = await request.validateUsing(updatePreferencesValidator);
    await user.save();

    return response.ok({
      message: "Preferences updated successfully",
      user: serialize.withoutWrapping(UserTransformer.transform(user)),
    });
  }
}
