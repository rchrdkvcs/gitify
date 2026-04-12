import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("forks_count").notNullable().defaultTo(0);
      table.integer("total_contributors_count").nullable();
      table.string("latest_release").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("forks_count");
      table.dropColumn("total_contributors_count");
      table.dropColumn("latest_release");
    });
  }
}
