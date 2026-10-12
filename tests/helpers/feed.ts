import type { ProjectFeedService } from "#services/project_feed_service";
import type { Difficulty } from "#shared/types/index";
import { normalizePreferenceLanguages } from "#shared/preferences";

/** First catalogue page filtered on a GitHub search level and languages. */
export async function feedFor(
  service: ProjectFeedService,
  userId: string | null,
  criteria: { difficulty: Difficulty; languages: string[] },
  token: string,
) {
  const result = await service.explore(
    {
      q: "",
      topic: null,
      languages: normalizePreferenceLanguages(criteria.languages),
      level: criteria.difficulty,
      sort: "stars",
      minScore: null,
    },
    1,
    { userId, token },
  );
  return { ...result, available: result.meta.total };
}
