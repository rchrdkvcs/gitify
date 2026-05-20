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
    detailsCacheDays: 7,
  },
  feed: {
    fetchThreshold: 25,
    perLanguageLimit: 60,
    totalLimit: 60,
    likedPageLimit: 20,
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
    ],
    pool: 30,
    perLanguage: 6,
    minThreshold: 4,
    topContributorsDisplay: 2,
    topicsDisplay: 2,
    seederDifficulty: "expert" as const,
  },
};

export default gitifyConfig;
