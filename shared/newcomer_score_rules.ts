import type { NewcomerSignalKey } from "./types/project.js";

export const newcomerScoreWeights: Record<NewcomerSignalKey, number> = {
  firstResponse: 25,
  externalMergeRate: 20,
  goodFirstIssues: 20,
  communityProfile: 15,
  maintainerActivity: 20,
};

export const newcomerScoreRules = {
  minimumCoverage: 0.5,
  firstResponseHours: { ideal: 24, worst: 24 * 30 },
  externalMergeRate: { full: 0.8, minimumDecided: 3 },
  goodFirstIssues: { full: 5 },
  communityFiles: {
    contributing: 0.4,
    issueTemplate: 0.25,
    codeOfConduct: 0.2,
    pullRequestTemplate: 0.15,
  },
  maintainerActivityDays: { ideal: 14, worst: 365 },
} as const;
