import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "contributors";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.integer("project_id").unsigned().references("projects.id").onDelete("CASCADE");
      table.bigInteger("github_user_id").unsigned();
      table.string("login").notNullable();
      table.string("avatar_url").notNullable();
      table.string("profile_url").notNullable();
      table.integer("contributions").defaultTo(0);
      table.unique(["project_id", "github_user_id"]);
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
