import type ProjectCatalogue from "#services/feeds/project_catalogue";
import type { Difficulty } from "#shared/types/index";
import { normalizePreferenceLanguages } from "#shared/preferences";

export async function feedFor(
  service: Pick<ProjectCatalogue, "explore">,
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
