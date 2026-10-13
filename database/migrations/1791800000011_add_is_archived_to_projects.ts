import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_archived").notNullable().defaultTo(false);
    });
    this.defer(async (db) => {
      await db.rawQuery(
        "UPDATE projects SET is_archived = true WHERE (insights->>'isArchived')::boolean IS TRUE",
      );
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_archived");
    });
  }
}
