export const PROJECT_QUERY_KEYS = {
  feed: ["projects", "feed"] as const,
  favorites: ["projects", "favorites"] as const,
};

export const feedQuery = defineQueryOptions(() => ({
  key: PROJECT_QUERY_KEYS.feed,
  query: () => useApi("/projects/feed"),
}));

export const favoritesQuery = defineQueryOptions(() => ({
  key: PROJECT_QUERY_KEYS.favorites,
  query: () => useApi("/projects/favorites"),
}));
