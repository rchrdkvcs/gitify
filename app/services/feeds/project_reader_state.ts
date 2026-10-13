import type Project from "#models/project";
import type { Difficulty } from "#shared/types/index";
import ProjectSearchMembership from "#models/project_search_membership";
import UserProjectFavorite from "#models/user_project_favorite";

export async function favoriteProjectIds(
  projects: Project[],
  userId: string | null,
): Promise<Set<string>> {
  if (!userId || projects.length === 0) {
    return new Set<string>();
  }
  const favorites = await UserProjectFavorite.query()
    .where("userId", userId)
    .whereIn(
      "projectId",
      projects.map((project) => project.id),
    )
    .select("projectId");
  return new Set(favorites.map((favorite) => favorite.projectId));
}

export async function displayedDifficulties(projects: Project[]): Promise<Map<string, Difficulty>> {
  const levels = new Map(projects.map((project) => [project.id, project.difficulty]));
  if (!projects.length) {
    return levels;
  }
  const memberships = await ProjectSearchMembership.query()
    .whereIn(
      "projectId",
      projects.map((project) => project.id),
    )
    .select("projectId", "difficulty");
  const current = new Map<string, Difficulty>();
  for (const membership of memberships) {
    if (current.get(membership.projectId) !== "beginner") {
      current.set(membership.projectId, membership.difficulty);
    }
  }
  for (const [id, difficulty] of current) {
    levels.set(id, difficulty);
  }
  return levels;
}
