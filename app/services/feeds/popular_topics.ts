import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import gitifyConfig from "#config/gitify";
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

type CachedTopics = { topics: string[]; expiresAt: DateTime };

function criteriaKey(criteria: ListingCriteria): string {
  const languages = criteria.languages.map((language) => language.toLowerCase()).sort();
  return JSON.stringify([languages, criteria.level]);
}

export class PopularTopics {
  private readonly entries = new Map<string, CachedTopics>();

  constructor(
    private readonly now: () => DateTime = () => DateTime.now(),
    private readonly ttlSeconds = gitifyConfig.feed.popularTopicsTtlSeconds,
    private readonly maxEntries = gitifyConfig.feed.popularTopicsCacheSize,
  ) {}

  async list(criteria: ListingCriteria): Promise<string[]> {
    const key = criteriaKey(criteria);
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > this.now()) {
      return cached.topics;
    }
    const topics = await popularTopics(criteria);
    this.entries.delete(key);
    this.entries.set(key, { topics, expiresAt: this.now().plus({ seconds: this.ttlSeconds }) });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    return topics;
  }

  clear(): void {
    this.entries.clear();
  }
}
