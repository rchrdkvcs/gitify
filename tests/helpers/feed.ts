import type { ProjectFeedService } from "#services/project_feed_service";
import type { UserPreferences } from "#shared/types/index";
import { normalizePreferenceLanguages } from "#shared/preferences";

/** First catalogue page filtered exactly like a reader's preferences. */
export async function feedFor(
  service: ProjectFeedService,
  userId: string | null,
  preferences: UserPreferences,
  token: string,
) {
  const result = await service.explore(
    {
      q: "",
      topic: null,
      languages: normalizePreferenceLanguages(preferences.languages),
      level: preferences.difficulty,
      sort: "stars",
    },
    1,
    { userId, token },
  );
  return { ...result, available: result.meta.total };
}
