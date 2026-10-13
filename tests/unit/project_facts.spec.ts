import { test } from "@japa/runner";
import type { RepositoryInsights } from "#shared/types/index";
import {
  commitSeries,
  communityChecklist,
  difficultyLabel,
  healthTier,
  projectFacts,
  resolvedRate,
  type ProjectFactsSource,
} from "../../inertia/lib/project-facts.js";

function insights(overrides: Partial<RepositoryInsights> = {}): RepositoryInsights {
  return {
    watchers: 0,
    openIssues: 3,
    closedIssues: 9,
    openPullRequests: 2,
    mergedPullRequests: 5,
    goodFirstIssues: 4,
    helpWantedIssues: 1,
    commits: null,
    releases: 0,
    latestReleaseAt: null,
    diskUsageKb: null,
    defaultBranch: "main",
    isArchived: false,
    lastCommitAt: null,
    languages: [],
    weeklyCommits: null,
    health: null,
    issues: [],
    beginnerIssues: [],
    pullRequests: [],
    ...overrides,
  };
}

function source(overrides: Partial<ProjectFactsSource> = {}): ProjectFactsSource {
  return {
    difficulty: "beginner",
    openIssuesCount: 42,
    totalContributorsCount: 7,
    insights: null,
    ...overrides,
  };
}

const allFiles = {
  readme: true,
  contributing: true,
  codeOfConduct: false,
  license: true,
  issueTemplate: false,
  pullRequestTemplate: true,
};

test("difficulty labels come from the issue kind catalog", ({ assert }) => {
  assert.equal(difficultyLabel("beginner"), "good first issue");
  assert.equal(difficultyLabel("expert"), "help wanted");
});

test("commit series sums the weeks and keeps a peak of at least one", ({ assert }) => {
  assert.deepEqual(commitSeries([0, 3, 0, 5]), {
    weeks: [0, 3, 0, 5],
    total: 8,
    peak: 5,
    activeWeeks: 2,
  });
  assert.deepEqual(commitSeries([]), { weeks: [], total: 0, peak: 1, activeWeeks: 0 });
});

test("resolved rate floors the closed share and is unknown without issues", ({ assert }) => {
  assert.equal(resolvedRate(2, 1), 66);
  assert.equal(resolvedRate(0, 4), 0);
  assert.isNull(resolvedRate(0, 0));
});

test("health tiers split at 80 and 50 percent", ({ assert }) => {
  assert.equal(healthTier(100), "Excellente");
  assert.equal(healthTier(80), "Excellente");
  assert.equal(healthTier(79), "Correcte");
  assert.equal(healthTier(50), "Correcte");
  assert.equal(healthTier(49), "À améliorer");
  assert.equal(healthTier(0), "À améliorer");
});

test("community checklist lists every file in a stable order", ({ assert }) => {
  assert.deepEqual(communityChecklist(allFiles), [
    { label: "README", done: true },
    { label: "Guide de contribution", done: true },
    { label: "Code de conduite", done: false },
    { label: "Licence", done: true },
    { label: "Modèles d’issue", done: false },
    { label: "Modèle de pull request", done: true },
  ]);
});

test("facts without insights fall back to the stored project counts", ({ assert }) => {
  const facts = projectFacts(source({ difficulty: "expert" }));
  assert.equal(facts.difficultyLabel, "help wanted");
  assert.deepEqual(facts.counts, {
    goodFirstIssues: null,
    helpWantedIssues: null,
    openIssues: 42,
    closedIssues: null,
    openPullRequests: null,
    mergedPullRequests: null,
    contributors: 7,
  });
  assert.isNull(facts.resolvedRate);
  assert.isNull(facts.commits);
  assert.isNull(facts.recentCommits);
  assert.isNull(facts.health);
  assert.deepEqual(facts.communityChecklist, []);
});

test("facts prefer the insights snapshot when present", ({ assert }) => {
  const weeklyCommits = Array.from({ length: 52 }, (_, index) => (index < 26 ? 10 : 1));
  const facts = projectFacts(
    source({
      insights: insights({ weeklyCommits, health: { percentage: 62, files: allFiles } }),
    }),
  );
  assert.equal(facts.counts.openIssues, 3);
  assert.equal(facts.counts.goodFirstIssues, 4);
  assert.equal(facts.resolvedRate, 75);
  assert.equal(facts.commits?.total, 286);
  assert.equal(facts.commits?.peak, 10);
  assert.equal(facts.recentCommits?.weeks.length, 26);
  assert.equal(facts.recentCommits?.total, 26);
  assert.equal(facts.recentCommits?.peak, 1);
  assert.deepEqual(facts.health, { percentage: 62, tier: "Correcte" });
  assert.lengthOf(facts.communityChecklist, 6);
});
