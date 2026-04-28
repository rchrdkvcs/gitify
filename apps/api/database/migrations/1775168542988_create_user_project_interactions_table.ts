import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "user_project_interactions";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table.string("user_id").references("id").inTable("users").onDelete("CASCADE");
      table.string("project_id").references("id").inTable("projects").onDelete("CASCADE");
      table.enum("type", ["liked", "passed"]).notNullable();
      table.unique(["user_id", "project_id"]);
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable("user_project_interactions");
  }
}
