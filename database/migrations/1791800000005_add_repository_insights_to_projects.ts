import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Search metadata: available for every listed repository.
      table.string("owner_avatar_url").nullable();
      table.string("homepage_url").nullable();
      table.string("license").nullable();
      table.timestamp("pushed_at", { useTz: true }).nullable();
      table.timestamp("github_created_at", { useTz: true }).nullable();
      // Detail snapshot: refreshed with README and contributors.
      table.jsonb("insights").nullable();
      table.text("contributing").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("owner_avatar_url");
      table.dropColumn("homepage_url");
      table.dropColumn("license");
      table.dropColumn("pushed_at");
      table.dropColumn("github_created_at");
      table.dropColumn("insights");
      table.dropColumn("contributing");
    });
  }
}
