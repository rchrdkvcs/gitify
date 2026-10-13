import db from "@adonisjs/lucid/services/db";
import { type ListingCriteria, listedProjects } from "#services/feeds/visible_projects";

export async function popularTopics(filters: ListingCriteria, limit = 14): Promise<string[]> {
  const scope = listedProjects(filters).select("id");
  const rows = await db
    .from("projects")
    .joinRaw(
      "CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(projects.topics) = 'array' THEN projects.topics ELSE '[]'::jsonb END) AS topic",
    )
    .whereIn("projects.id", scope)
    .select(db.raw("topic, count(*) AS total"))
    .groupBy("topic")
    .orderBy("total", "desc")
    .orderBy("topic", "asc")
    .limit(limit);
  return rows.map((row: { topic: string }) => row.topic);
}
