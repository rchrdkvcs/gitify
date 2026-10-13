import type { PreferenceLanguage } from "#shared/preferences";

const NEWCOMER_SCORE_RECENT_ITEMS_PER_KIND = 25;
const REPOSITORY_SEARCH_TTL_HOURS = 24;
const FAST_TAKEN_ISSUES_TTL_HOURS = REPOSITORY_SEARCH_TTL_HOURS / 4;

const gitifyConfig = {
  github: {
    baseUrl: "https://api.github.com/search/repositories",
    repoBaseUrl: "https://api.github.com/repos",
    graphqlUrl: "https://api.github.com/graphql",
    userReposUrl: "https://api.github.com/user/repos",
    userRepositoriesLimit: 100,
    apiVersion: "2026-03-10",
    acceptHeader: "application/vnd.github+json",
    textMatchAcceptHeader: "application/vnd.github.text-match+json",
    search: {
      defaultPerPage: 100,
      expertMinStars: 1000,
    },
    contributors: {
      topContributorsLimit: 30,
    },
    insights: {
      issuesLimit: 20,
      pullRequestsLimit: 20,
      languagesLimit: 12,
      activitySampleSize: NEWCOMER_SCORE_RECENT_ITEMS_PER_KIND,
      contributingPaths: ["CONTRIBUTING.md", ".github/CONTRIBUTING.md", "docs/CONTRIBUTING.md"],
    },
    issues: {
      searchPerPage: 100,
      labelsLimit: 10,
      topicsLimit: 10,
    },
  },
  cache: {
    fetchTtlHours: REPOSITORY_SEARCH_TTL_HOURS,
    searchRetrySeconds: 60,
    maxConcurrentSearches: 2,
    detailsCacheHours: 12,
    detailsRetrySeconds: 900,
    issueFetchTtlHours: FAST_TAKEN_ISSUES_TTL_HOURS,
  },
  feed: {
    pageSize: 24,
    favoritePageLimit: 20,
  },
  issues: {
    pageSize: 24,
  },
  showcase: {
    languages: [
      "typescript",
      "javascript",
      "python",
      "rust",
      "go",
      "c++",
      "php",
      "java",
      "kotlin",
      "swift",
      "dart",
      "ruby",
    ] satisfies PreferenceLanguage[],
    pool: 30,
    perLanguage: 6,
    detailsRefreshLimit: 2,
    topContributorsDisplay: 2,
    topicsDisplay: 2,
    seederDifficulty: "expert" as const,
  },
};

export default gitifyConfig;
