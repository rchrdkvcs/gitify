import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";
import { test } from "@japa/runner";
import Project from "#models/project";
import { upsertRepositories } from "#services/repository_identity";
import { githubRepository } from "#tests/helpers/fake_github_adapter";

test.group("Repository identity", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("inserts new repositories and updates known ones in one statement", async ({ assert }) => {
    const existing = await Project.create({
      githubRepoId: 301,
      name: "old-name",
      ownerName: "owner",
      repositoryUrl: "https://github.com/owner/old-name",
      difficulty: "expert",
      language: "rust",
      stars: 1,
      topics: ["kept"],
    });

    const ids = await db.transaction((trx) =>
      upsertRepositories(
        [
          githubRepository({
            id: 302,
            name: "fresh",
            topics: ["cli"],
            pushedAt: "2026-10-01T00:00:00Z",
          }),
          githubRepository({ id: 301, name: "renamed", stars: 42, topics: ["new"] }),
          githubRepository({
            id: 302,
            name: "fresh",
            topics: ["cli"],
            pushedAt: "2026-10-01T00:00:00Z",
          }),
        ],
        { searchLanguage: "go", legacyDifficulty: "beginner", topics: "keep" },
        trx,
      ),
    );

    assert.deepEqual([...ids.keys()], [301, 302]);
    assert.equal(ids.get(301), existing.id);
    await existing.refresh();
    assert.equal(existing.name, "renamed");
    assert.equal(existing.stars, 42);
    assert.equal(existing.language, "typescript");
    assert.equal(existing.difficulty, "expert");
    assert.deepEqual(existing.topics, ["kept"]);

    const inserted = await Project.findOrFail(ids.get(302));
    assert.equal(inserted.githubRepoId, 302);
    assert.equal(inserted.difficulty, "beginner");
    assert.deepEqual(inserted.topics, ["cli"]);
    assert.equal(inserted.pushedAt?.toISO(), "2026-10-01T00:00:00.000+00:00");
    assert.isNotNull(inserted.createdAt);
    assert.lengthOf(inserted.id, 26);
  });

  test("refreshes topics when the import owns them", async ({ assert }) => {
    const existing = await Project.create({
      githubRepoId: 401,
      name: "repo",
      ownerName: "owner",
      repositoryUrl: "https://github.com/owner/repo",
      difficulty: "beginner",
      topics: ["old"],
    });

    await db.transaction((trx) =>
      upsertRepositories(
        [githubRepository({ id: 401, language: null, topics: ["new"] })],
        { searchLanguage: "go", legacyDifficulty: "expert", topics: "refresh" },
        trx,
      ),
    );

    await existing.refresh();
    assert.deepEqual(existing.topics, ["new"]);
    assert.equal(existing.language, "go");
    assert.equal(existing.difficulty, "beginner");
  });

  test("an empty import touches nothing", async ({ assert }) => {
    const ids = await db.transaction((trx) =>
      upsertRepositories(
        [],
        { searchLanguage: "go", legacyDifficulty: "expert", topics: "refresh" },
        trx,
      ),
    );
    assert.equal(ids.size, 0);
  });
});
