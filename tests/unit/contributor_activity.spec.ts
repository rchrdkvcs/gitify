import { test } from "@japa/runner";
import {
  type ActivitySampleItem,
  summarizeContributorActivity,
} from "#services/github/contributor_activity";

const now = new Date("2026-10-12T00:00:00Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

function item(overrides: Partial<ActivitySampleItem>): ActivitySampleItem {
  return {
    kind: "issue",
    createdAt: hoursAgo(500),
    authorAssociation: "NONE",
    automated: false,
    state: "OPEN",
    mergedAt: null,
    replies: [],
    ...overrides,
  };
}

const extra = { lastMergedPullRequestAt: null, unassignedGoodFirstIssues: 3 };

test.group("Contributor activity", () => {
  test("measures the first maintainer answer to outside contributors", ({ assert }) => {
    const activity = summarizeContributorActivity(
      [
        // Answered by a member after 10 h; the author's own comment does not count.
        item({
          createdAt: hoursAgo(100),
          replies: [
            { createdAt: hoursAgo(98), authorAssociation: "NONE" },
            { createdAt: hoursAgo(90), authorAssociation: "MEMBER" },
          ],
        }),
        // Merged without comment after 20 h: merging is an answer.
        item({
          kind: "pull",
          createdAt: hoursAgo(200),
          state: "MERGED",
          mergedAt: hoursAgo(180),
        }),
        // Never answered for 400 h: counted with its age.
        item({ kind: "pull", createdAt: hoursAgo(400), state: "CLOSED" }),
        // Too recent to judge, maintainers' own work and bots are ignored.
        item({ createdAt: hoursAgo(10) }),
        item({ authorAssociation: "OWNER" }),
        item({ kind: "pull", automated: true, state: "MERGED", mergedAt: hoursAgo(1) }),
      ],
      extra,
      now,
    );

    assert.deepEqual(activity, {
      sampledItems: 3,
      respondedItems: 2,
      medianFirstResponseHours: 20,
      externalPullRequestsMerged: 1,
      externalPullRequestsClosed: 1,
      lastMergedPullRequestAt: null,
      unassignedGoodFirstIssues: 3,
    });
  });

  test("withholds the response time when fewer than three items can be judged", ({ assert }) => {
    const activity = summarizeContributorActivity(
      [item({ replies: [{ createdAt: hoursAgo(499), authorAssociation: "COLLABORATOR" }] })],
      extra,
      now,
    );
    assert.equal(activity.sampledItems, 1);
    assert.isNull(activity.medianFirstResponseHours);
  });
});
