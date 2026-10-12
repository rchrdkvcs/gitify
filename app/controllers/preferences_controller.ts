import type { HttpContext } from "@adonisjs/core/http";
import { updatePreferencesValidator } from "#validators/update_preferences_validator";

export default class PreferencesController {
  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();

    user.preferences = await request.validateUsing(updatePreferencesValidator);
    await user.save();

    return response.redirect("/explore");
  }
}
