import type { PreferenceLanguage } from "#shared/preferences";

const gitifyConfig = {
  github: {
    baseUrl: "https://api.github.com/search/repositories",
    repoBaseUrl: "https://api.github.com/repos",
    apiVersion: "2026-03-10",
    acceptHeader: "application/vnd.github+json",
    textMatchAcceptHeader: "application/vnd.github.text-match+json",
    search: {
      defaultPerPage: 100,
      expertMinStars: 1000,
    },
    contributors: {
      topContributorsLimit: 10,
    },
  },
  cache: {
    fetchTtlHours: 24,
    searchRetrySeconds: 60,
    maxConcurrentSearches: 2,
    detailsCacheDays: 7,
  },
  feed: {
    perLanguageLimit: 60,
    totalLimit: 60,
    favoritePageLimit: 20,
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
