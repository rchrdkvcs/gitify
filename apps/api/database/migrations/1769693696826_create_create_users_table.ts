import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name").nullable();
      table.string("email").notNullable().unique();
      table.string("access_token").nullable();
      table.boolean("is_verified").defaultTo(false);
      table.string("avatar_url").nullable();
      table.jsonb("preferences").nullable();

      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
