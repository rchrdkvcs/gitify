export const HEALTH_QUERY_KEYS = {
  root: ["health"] as const,
};

export const healthQuery = defineQueryOptions(() => ({
  key: HEALTH_QUERY_KEYS.root,
  query: () => useApi("/"),
}));
