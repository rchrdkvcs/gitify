import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "project_issues";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table
        .string("project_id")
        .notNullable()
        .references("id")
        .inTable("projects")
        .onDelete("CASCADE");
      table.bigInteger("github_issue_id").notNullable().unique();
      table.integer("number").notNullable();
      table.text("title").notNullable();
      table.string("url").notNullable();
      table.jsonb("labels").notNullable().defaultTo("[]");
      table.integer("comments_count").notNullable().defaultTo(0);
      table.integer("assignees_count").notNullable().defaultTo(0);
      table.timestamp("github_created_at", { useTz: true }).nullable();
      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.index(["project_id"]);
      table.index(["github_created_at"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
