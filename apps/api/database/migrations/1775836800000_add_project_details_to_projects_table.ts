import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("readme").nullable();
      table.jsonb("languages").nullable();
      table.timestamp("details_fetched_at", { useTz: true }).nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("readme");
      table.dropColumn("languages");
      table.dropColumn("details_fetched_at");
    });
  }
}
