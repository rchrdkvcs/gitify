import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp("details_retry_after", { useTz: true }).nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("details_retry_after");
    });
  }
}
