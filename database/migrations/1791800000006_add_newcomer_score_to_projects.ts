import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Sortable score; null until the detail snapshot has been fetched with enough signals.
      table.smallint("newcomer_score").nullable();
      // Full breakdown (signals, weights, coverage), recomputed with each detail snapshot.
      table.jsonb("newcomer_score_details").nullable();
    });
    // Existing snapshots lack contributor activity: their score appears at the next refresh.
    this.schema.raw(
      "CREATE INDEX projects_newcomer_score_index ON projects (newcomer_score DESC NULLS LAST)",
    );
  }

  async down() {
    this.schema.raw("DROP INDEX IF EXISTS projects_newcomer_score_index");
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("newcomer_score");
      table.dropColumn("newcomer_score_details");
    });
  }
}
