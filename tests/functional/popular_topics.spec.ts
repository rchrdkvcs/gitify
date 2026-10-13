import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import Project from "#models/project";
import ProjectSearchMembership from "#models/project_search_membership";
import { PopularTopics, popularTopics } from "#services/feeds/popular_topics";

let nextRepoId = 7300;

async function topicProject(language: string, topics: string[]) {
  const project = await Project.create({
    githubRepoId: nextRepoId++,
    ownerName: "topic-owner",
    name: `topics-${nextRepoId}`,
    repositoryUrl: `https://github.com/topic-owner/topics-${nextRepoId}`,
    difficulty: "beginner",
    topics,
  });
  await ProjectSearchMembership.create({ projectId: project.id, language, difficulty: "beginner" });
  return project;
}

function clockAt(start: DateTime) {
  const clock = { now: start };
  return { clock, now: () => clock.now };
}

test.group("Popular topics", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("ranks topics of listed repositories", async ({ assert }) => {
    await topicProject("elixir", ["web", "cli"]);
    await topicProject("elixir", ["web"]);
    await topicProject("zig", ["embedded"]);

    assert.deepEqual(await popularTopics({ languages: ["elixir"], level: "all" }), ["web", "cli"]);
  });

  test("serves cached topics per criteria until the TTL expires", async ({ assert }) => {
    const { clock, now } = clockAt(DateTime.fromISO("2026-10-13T10:00:00Z"));
    const topics = new PopularTopics(now, 60, 10);
    await topicProject("elixir", ["web"]);

    assert.deepEqual(await topics.list({ languages: ["Elixir", "zig"], level: "all" }), ["web"]);
    await topicProject("zig", ["embedded"]);
    assert.deepEqual(await topics.list({ languages: ["zig", "elixir"], level: "all" }), ["web"]);
    assert.sameMembers(await topics.list({ languages: ["zig", "elixir"], level: "beginner" }), [
      "web",
      "embedded",
    ]);

    clock.now = clock.now.plus({ seconds: 61 });
    assert.sameMembers(await topics.list({ languages: ["elixir", "zig"], level: "all" }), [
      "web",
      "embedded",
    ]);
  });

  test("evicts the oldest criteria beyond the cache size", async ({ assert }) => {
    const { now } = clockAt(DateTime.fromISO("2026-10-13T10:00:00Z"));
    const topics = new PopularTopics(now, 60, 1);
    await topicProject("elixir", ["web"]);
    await topicProject("zig", ["embedded"]);

    await topics.list({ languages: ["elixir"], level: "all" });
    await topicProject("elixir", ["otp"]);
    await topics.list({ languages: ["zig"], level: "all" });

    assert.deepEqual(await topics.list({ languages: ["elixir"], level: "all" }), ["otp", "web"]);
  });

  test("clears cached topics", async ({ assert }) => {
    const { now } = clockAt(DateTime.fromISO("2026-10-13T10:00:00Z"));
    const topics = new PopularTopics(now, 60, 10);
    await topicProject("elixir", ["web"]);

    await topics.list({ languages: ["elixir"], level: "all" });
    await topicProject("elixir", ["otp"]);
    assert.deepEqual(await topics.list({ languages: ["elixir"], level: "all" }), ["web"]);

    topics.clear();
    assert.deepEqual(await topics.list({ languages: ["elixir"], level: "all" }), ["otp", "web"]);
  });
});
