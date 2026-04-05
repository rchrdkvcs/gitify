export const PROJECT_QUERY_KEYS = {
  feed: ["projects", "feed"] as const,
  liked: ["projects", "liked"] as const,
};

export const feedQuery = defineQueryOptions(() => ({
  key: PROJECT_QUERY_KEYS.feed,
  query: () => useApi("/projects/feed"),
}));

export const likedQuery = defineQueryOptions(() => ({
  key: PROJECT_QUERY_KEYS.liked,
  query: () => useApi("/projects/liked"),
}));
