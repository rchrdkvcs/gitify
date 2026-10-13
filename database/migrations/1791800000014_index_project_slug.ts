import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.schema.raw(
      "CREATE INDEX projects_slug_lower_index ON projects (lower(owner_name), lower(name))",
    );
  }

  async down() {
    this.schema.raw("DROP INDEX projects_slug_lower_index");
  }
}
