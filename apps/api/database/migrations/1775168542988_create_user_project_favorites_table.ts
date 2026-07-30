import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "user_project_favorites";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table.string("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
      table
        .string("project_id")
        .notNullable()
        .references("id")
        .inTable("projects")
        .onDelete("CASCADE");
      table.unique(["user_id", "project_id"]);
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
