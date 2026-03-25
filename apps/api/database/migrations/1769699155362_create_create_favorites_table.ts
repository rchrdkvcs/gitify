import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "favorites";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary();

      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table
        .integer("project_id")
        .unsigned()
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
