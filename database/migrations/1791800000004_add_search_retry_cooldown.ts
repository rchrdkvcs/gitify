import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "github_fetch_caches";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp("fetched_at").nullable().alter();
      table.timestamp("retry_after").nullable();
    });
  }

  async down() {
    // Never-successful criteria have no search snapshot to preserve on rollback.
    this.defer(async (db) => {
      await db.from(this.tableName).whereNull("fetched_at").delete();
    });
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("retry_after");
      table.timestamp("fetched_at").notNullable().alter();
    });
  }
}
