export const PROJECT_QUERY_KEYS = {
  feed: ["projects", "feed"] as const,
};

export const feedQuery = defineQueryOptions(() => ({
  key: PROJECT_QUERY_KEYS.feed,
  query: () => useApi("/projects/feed"),
}));
