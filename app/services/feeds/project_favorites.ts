import type { PaginationMeta, Project as ProjectList } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import Project from "#models/project";
import UserProjectFavorite from "#models/user_project_favorite";
import { paginationMeta } from "#services/feeds/feed_query";
import { displayedDifficulties } from "#services/feeds/project_reader_state";
import { projectCardColumns } from "#services/feeds/visible_projects";
import { normalizePage } from "#shared/pagination";
import ProjectTransformer from "#transformers/project_transformer";

export type FavoritePage = { projects: ProjectList[]; meta: PaginationMeta };

const perPage = gitifyConfig.feed.favoritePageLimit;

function favoritesOf(userId: string) {
  return UserProjectFavorite.query()
    .where("userId", userId)
    .orderBy("createdAt", "desc")
    .orderBy("id", "desc")
    .preload("project", (project) => project.select(projectCardColumns));
}

async function lastPageOf(userId: string): Promise<number> {
  const total = await UserProjectFavorite.query().where("userId", userId).count("* as total");
  return Math.max(1, Math.ceil(Number(total[0]?.$extras.total ?? 0) / perPage));
}

export async function favoritePage(userId: string, requestedPage: unknown): Promise<FavoritePage> {
  const page = Math.min(normalizePage(requestedPage), await lastPageOf(userId));
  let favorites = await favoritesOf(userId).paginate(page, perPage);
  if (page > Math.max(1, favorites.lastPage)) {
    favorites = await favoritesOf(userId).paginate(Math.max(1, favorites.lastPage), perPage);
  }
  const projects = favorites.all().map((favorite) => favorite.project);
  const levels = await displayedDifficulties(projects);
  return {
    projects: projects.map((project) =>
      new ProjectTransformer(project, {
        isFavorite: true,
        difficulty: levels.get(project.id)!,
      }).toObject(),
    ),
    meta: paginationMeta(favorites),
  };
}

export async function addFavorite(userId: string, projectId: string): Promise<boolean> {
  const project = await Project.find(projectId);
  if (!project) {
    return false;
  }
  await UserProjectFavorite.firstOrCreate({ userId, projectId: project.id });
  return true;
}

export async function removeFavorite(userId: string, projectId: string): Promise<boolean> {
  const project = await Project.find(projectId);
  if (!project) {
    return false;
  }
  await UserProjectFavorite.query().where("userId", userId).where("projectId", project.id).delete();
  return true;
}
