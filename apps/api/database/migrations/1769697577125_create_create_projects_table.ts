import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "projects";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.bigInteger("github_repo_id").unsigned().notNullable().unique();
      table.string("owner_name").notNullable();
      table.string("name").notNullable();
      table.text("description").nullable();
      table.string("repository_url").notNullable();
      table.integer("stars").notNullable().defaultTo(0);
      table.string("language").nullable();
      table.jsonb("topics").nullable();

      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
