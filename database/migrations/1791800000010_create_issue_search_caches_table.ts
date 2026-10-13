import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "issue_search_caches";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table.string("language").notNullable();
      table.string("kind").notNullable();
      table.integer("total_stored").notNullable().defaultTo(0);
      table.timestamp("fetched_at").nullable();
      table.timestamp("retry_after").nullable();
      table.unique(["language", "kind"]);
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
