import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable("users", (table) => {
      // Existing accounts link only after verified ownership on their next login.
      table.string("github_user_id").nullable().unique();
    });
  }

  async down() {
    this.schema.alterTable("users", (table) => {
      table.dropColumn("github_user_id");
    });
  }
}
