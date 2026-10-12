import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.schema.raw("CREATE INDEX projects_stars_index ON projects (stars DESC)");
  }

  async down() {
    this.schema.raw("DROP INDEX projects_stars_index");
  }
}
