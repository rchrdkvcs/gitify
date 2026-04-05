import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "github_fetch_caches";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("language").notNullable();
      table.enum("difficulty", ["beginner", "expert"]).notNullable();
      table.integer("total_stored").notNullable().defaultTo(0);
      table.timestamp("fetched_at").notNullable();
      table.unique(["language", "difficulty"]);
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
