import { test } from "@japa/runner";
import type { RepositoryInsights } from "#shared/types/index";
import {
  computeNewcomerScore,
  type NewcomerScoreInput,
  newcomerScoreInputFromInsights,
  newcomerScoreTier,
  newcomerScoreWeights,
} from "#shared/newcomer_score";

const now = new Date("2026-10-12T00:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

const ideal: NewcomerScoreInput = {
  isArchived: false,
  medianFirstResponseHours: 6,
  externalPullRequests: { merged: 9, closed: 1 },
  unassignedGoodFirstIssues: 8,
  communityFiles: {
    contributing: true,
    issueTemplate: true,
    codeOfConduct: true,
    pullRequestTemplate: true,
  },
  lastCommitAt: daysAgo(2),
  lastMergedPullRequestAt: daysAgo(5),
};

const unknown: NewcomerScoreInput = {
  isArchived: false,
  medianFirstResponseHours: null,
  externalPullRequests: null,
  unassignedGoodFirstIssues: null,
  communityFiles: null,
  lastCommitAt: null,
  lastMergedPullRequestAt: null,
};

const signal = (score: ReturnType<typeof computeNewcomerScore>, key: string) =>
  score.signals.find((item) => item.key === key)!;

test.group("Newcomer score", () => {
  test("weights are explicit and sum to 100", ({ assert }) => {
    assert.equal(
      Object.values(newcomerScoreWeights).reduce((sum, weight) => sum + weight, 0),
      100,
    );
  });

  test("a welcoming repository scores 100 with a complete breakdown", ({ assert }) => {
    const score = computeNewcomerScore(ideal, now);
    assert.equal(score.score, 100);
    assert.isFalse(score.partial);
    assert.equal(score.coverage, 1);
    assert.deepEqual(
      score.signals.map((item) => [item.key, item.points]),
      [
        ["firstResponse", 25],
        ["externalMergeRate", 20],
        ["goodFirstIssues", 20],
        ["communityProfile", 15],
        ["maintainerActivity", 20],
      ],
    );
    assert.equal(signal(score, "externalMergeRate").value, 0.9);
    assert.equal(score.computedAt, now.toISOString());
  });

  test("normalises each signal between its ideal and worst values", ({ assert }) => {
    const score = computeNewcomerScore(
      {
        ...ideal,
        // Log scale between a day and a month: about 15 days earns a little over 15 %.
        medianFirstResponseHours: 360,
        externalPullRequests: { merged: 2, closed: 2 },
        unassignedGoodFirstIssues: 2,
        communityFiles: {
          contributing: true,
          issueTemplate: false,
          codeOfConduct: false,
          pullRequestTemplate: false,
        },
        lastCommitAt: daysAgo(400),
        lastMergedPullRequestAt: null,
      },
      now,
    );
    assert.closeTo(signal(score, "firstResponse").ratio!, 0.204, 0.001);
    assert.equal(signal(score, "externalMergeRate").ratio, 0.625);
    assert.equal(signal(score, "goodFirstIssues").points, 8);
    assert.equal(signal(score, "communityProfile").value, 1);
    assert.equal(signal(score, "communityProfile").points, 6);
    assert.equal(signal(score, "maintainerActivity").value, 400);
    assert.equal(signal(score, "maintainerActivity").points, 0);
    assert.equal(score.score, Math.round(5.1 + 12.5 + 8 + 6 + 0));
  });

  test("the most recent of last commit and last merged PR measures activity", ({ assert }) => {
    const score = computeNewcomerScore(
      { ...ideal, lastCommitAt: daysAgo(300), lastMergedPullRequestAt: daysAgo(10) },
      now,
    );
    assert.equal(signal(score, "maintainerActivity").value, 10);
    assert.equal(signal(score, "maintainerActivity").ratio, 1);
  });

  test("missing signals mark the score partial and rescale over known weight", ({ assert }) => {
    const score = computeNewcomerScore(
      { ...ideal, medianFirstResponseHours: null, externalPullRequests: null },
      now,
    );
    assert.isTrue(score.partial);
    assert.equal(score.coverage, 0.55);
    // Unknown signals neither earn nor cost points.
    assert.equal(score.score, 100);
    assert.isNull(signal(score, "firstResponse").points);
    assert.isNull(signal(score, "firstResponse").value);
  });

  test("too few decided external PRs leave the merge rate unknown", ({ assert }) => {
    const score = computeNewcomerScore(
      { ...ideal, externalPullRequests: { merged: 0, closed: 2 } },
      now,
    );
    assert.isNull(signal(score, "externalMergeRate").ratio);
    assert.isTrue(score.partial);
  });

  test("withholds the score below half of the weight", ({ assert }) => {
    const score = computeNewcomerScore(
      { ...unknown, communityFiles: ideal.communityFiles, lastCommitAt: daysAgo(1) },
      now,
    );
    assert.equal(score.coverage, 0.35);
    assert.isNull(score.score);
    assert.isTrue(score.partial);
  });

  test("archived repositories always score zero", ({ assert }) => {
    const score = computeNewcomerScore({ ...ideal, isArchived: true }, now);
    assert.equal(score.score, 0);
    assert.isTrue(score.archived);
    assert.isFalse(score.partial);
  });

  test("snapshots taken before activity was collected only feed known signals", ({ assert }) => {
    const insights = {
      isArchived: false,
      lastCommitAt: null,
      health: {
        percentage: 80,
        files: {
          readme: true,
          contributing: true,
          codeOfConduct: false,
          license: true,
          issueTemplate: true,
          pullRequestTemplate: false,
        },
      },
    } as unknown as RepositoryInsights;
    const input = newcomerScoreInputFromInsights(insights, daysAgo(3));
    assert.deepEqual(input, {
      isArchived: false,
      medianFirstResponseHours: null,
      externalPullRequests: null,
      unassignedGoodFirstIssues: null,
      communityFiles: {
        contributing: true,
        issueTemplate: true,
        codeOfConduct: false,
        pullRequestTemplate: false,
      },
      lastCommitAt: daysAgo(3),
      lastMergedPullRequestAt: null,
    });
  });

  test("tiers name score ranges", ({ assert }) => {
    assert.equal(newcomerScoreTier(90).tier, "excellent");
    assert.equal(newcomerScoreTier(50).tier, "good");
    assert.equal(newcomerScoreTier(30).tier, "fair");
    assert.equal(newcomerScoreTier(0).tier, "low");
  });
});
