import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "issue_search_memberships";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table
        .string("issue_id")
        .notNullable()
        .references("id")
        .inTable("project_issues")
        .onDelete("CASCADE");
      table.string("language").notNullable();
      table.string("kind").notNullable();
      table.unique(["language", "kind", "issue_id"]);
      table.index(["issue_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
