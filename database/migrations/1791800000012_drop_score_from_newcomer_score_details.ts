import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE projects
          SET newcomer_score = (newcomer_score_details->>'score')::smallint,
            newcomer_score_details = newcomer_score_details - 'score'
          WHERE newcomer_score_details->'score' IS NOT NULL`,
      );
    });
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE projects
          SET newcomer_score_details = newcomer_score_details || jsonb_build_object('score', newcomer_score)
          WHERE newcomer_score_details IS NOT NULL`,
      );
    });
  }
}
