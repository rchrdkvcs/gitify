import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "project_search_memberships";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table
        .string("project_id")
        .notNullable()
        .references("id")
        .inTable("projects")
        .onDelete("CASCADE");
      table.string("language").notNullable();
      table.string("difficulty").notNullable();
      table.unique(["language", "difficulty", "project_id"]);
      table.index(["project_id"]);
    });
    this.defer(async (db) => {
      await db.rawQuery(`INSERT INTO project_search_memberships (id, project_id, language, difficulty)
        SELECT id, id, lower(language), difficulty FROM projects WHERE language IS NOT NULL`);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
