import type { HttpContext } from "@adonisjs/core/http";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";
import UserTransformer from "#transformers/user_transformer";

export default class PreferencesController {
  async update({ auth, request, response, serialize }: HttpContext) {
    const user = auth.user!;

    user.preferences = await request.validateUsing(updatePreferencesValidator);
    await user.save();

    return response.ok({
      message: "Preferences updated successfully",
      user: serialize(UserTransformer.transform(user)),
    });
  }
}
