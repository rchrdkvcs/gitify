import type { QueryClientContract } from "@adonisjs/lucid/types/database";
import { BaseSchema } from "@adonisjs/lucid/schema";
import { difficultyForLevel } from "#shared/preferences";
import { normalizeUserPreferences } from "#shared/stored_preferences";

export async function upgradeStoredPreferences(db: QueryClientContract) {
  const rows = await db.from("users").whereNotNull("preferences").select("id", "preferences");
  for (const row of rows) {
    const preferences = normalizeUserPreferences(row.preferences);
    await db
      .from("users")
      .where("id", row.id)
      .update({ preferences: preferences ? JSON.stringify(preferences) : null });
  }
}

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp("onboarded_at", { useTz: true }).nullable();
      table.timestamp("onboarding_skipped_at", { useTz: true }).nullable();
      table.smallint("onboarding_step").notNullable().defaultTo(0);
    });
    this.defer(upgradeStoredPreferences);
  }

  async down() {
    this.defer(async (db) => {
      const rows = await db
        .from(this.tableName)
        .whereNotNull("preferences")
        .select("id", "preferences");
      for (const row of rows) {
        const preferences = normalizeUserPreferences(row.preferences);
        await db
          .from(this.tableName)
          .where("id", row.id)
          .update({
            preferences: preferences
              ? JSON.stringify({
                  difficulty: difficultyForLevel(preferences.level),
                  languages: preferences.languages,
                })
              : null,
          });
      }
    });
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("onboarded_at");
      table.dropColumn("onboarding_skipped_at");
      table.dropColumn("onboarding_step");
    });
  }
}
