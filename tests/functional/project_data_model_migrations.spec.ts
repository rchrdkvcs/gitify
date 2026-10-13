import type { BaseSchema } from "@adonisjs/lucid/schema";
import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";
import { test } from "@japa/runner";
import AddIsArchivedToProjects from "#database/migrations/1791800000011_add_is_archived_to_projects";
import DropScoreFromNewcomerScoreDetails from "#database/migrations/1791800000012_drop_score_from_newcomer_score_details";

let nextRepoId = 7300;

async function insertProject(name: string, columns: Record<string, unknown>) {
  await db.table("projects").insert({
    id: `migration-${name}`,
    github_repo_id: nextRepoId++,
    owner_name: "migration-owner",
    name,
    repository_url: `https://github.com/migration-owner/${name}`,
    difficulty: "beginner",
    ...columns,
  });
}

async function storedRow(name: string) {
  return db.from("projects").where("id", `migration-${name}`).firstOrFail();
}

function migration(Migration: typeof BaseSchema) {
  return new Migration(db.connection(), "migration-under-test", false);
}

test.group("Project data model migrations", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("backfills is_archived from the insights snapshot", async ({ assert }) => {
    await migration(AddIsArchivedToProjects).execDown();
    await insertProject("archived", { insights: JSON.stringify({ isArchived: true }) });
    await insertProject("active", { insights: JSON.stringify({ isArchived: false }) });
    await insertProject("unenriched", { insights: null });

    await migration(AddIsArchivedToProjects).execUp();

    const archivedFlags = await db
      .from("projects")
      .where("owner_name", "migration-owner")
      .orderBy("name")
      .select("name", "is_archived");
    assert.deepEqual(archivedFlags, [
      { name: "active", is_archived: false },
      { name: "archived", is_archived: true },
      { name: "unenriched", is_archived: false },
    ]);
  });

  test("moves the duplicated score out of the score details", async ({ assert }) => {
    const breakdown = { version: 1, partial: false, coverage: 1, archived: false, signals: [] };
    await insertProject("scored", {
      newcomer_score: 12,
      newcomer_score_details: JSON.stringify({ ...breakdown, score: 64 }),
    });
    await insertProject("unscorable", {
      newcomer_score: null,
      newcomer_score_details: JSON.stringify({ ...breakdown, partial: true, score: null }),
    });
    await insertProject("unenriched", { newcomer_score: null, newcomer_score_details: null });

    await migration(DropScoreFromNewcomerScoreDetails).execUp();

    const scored = await storedRow("scored");
    assert.equal(scored.newcomer_score, 64);
    assert.deepEqual(scored.newcomer_score_details, breakdown);
    const unscorable = await storedRow("unscorable");
    assert.isNull(unscorable.newcomer_score);
    assert.deepEqual(unscorable.newcomer_score_details, { ...breakdown, partial: true });
    const unenriched = await storedRow("unenriched");
    assert.isNull(unenriched.newcomer_score_details);

    await migration(DropScoreFromNewcomerScoreDetails).execDown();

    const restored = await storedRow("scored");
    assert.deepEqual(restored.newcomer_score_details, { ...breakdown, score: 64 });
    const stillUnenriched = await storedRow("unenriched");
    assert.isNull(stillUnenriched.newcomer_score_details);
  });
});
