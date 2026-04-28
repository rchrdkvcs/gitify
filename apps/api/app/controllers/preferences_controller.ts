import type { HttpContext } from "@adonisjs/core/http";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";

export default class PreferencesController {
  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!;

    user.preferences = await request.validateUsing(updatePreferencesValidator);
    await user.save();

    const serialized = user.serialize({
      fields: {
        omit: ["id", "githubAccessToken", "email", "createdAt", "updatedAt"],
      },
    });

    return response.ok({ message: "Preferences updated successfully", user: serialized });
  }
}
