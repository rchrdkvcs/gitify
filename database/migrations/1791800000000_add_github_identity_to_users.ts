import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable("users", (table) => {
      table.string("github_user_id").nullable().unique();
    });
  }

  async down() {
    this.schema.alterTable("users", (table) => {
      table.dropColumn("github_user_id");
    });
  }
}
