import logger from "@adonisjs/core/services/logger";
import type GitHubSyncService from "#services/github/github_sync_service";
import type { ProjectDetail } from "#shared/types/index";
import { displayedDifficulties, favoriteProjectIds } from "#services/feeds/project_reader_state";
import { reachableProject } from "#services/feeds/visible_projects";
import ProjectDetailTransformer from "#transformers/project_detail_transformer";

type DetailSync = Pick<GitHubSyncService, "needsDetailsFetch" | "fetchProjectDetails">;

export type DetailReader = { userId: string | null; token: string | null };

export default class ProjectDetailReader {
  constructor(private readonly sync: DetailSync) {}

  async read(ownerName: string, name: string, reader: DetailReader): Promise<ProjectDetail | null> {
    const project = await reachableProject(ownerName, name);
    if (!project) {
      return null;
    }
    if (reader.token && this.sync.needsDetailsFetch(project)) {
      await this.sync
        .fetchProjectDetails(project, reader.token)
        .catch((error) =>
          logger.error({ err: error, projectId: project.id }, "Project details refresh failed"),
        );
    }
    await project.load("contributors", (query) =>
      query.orderBy("contributions", "desc").orderBy("id", "asc"),
    );
    const favoriteIds = await favoriteProjectIds([project], reader.userId);
    const levels = await displayedDifficulties([project]);
    return new ProjectDetailTransformer(project, {
      isFavorite: favoriteIds.has(project.id),
      difficulty: levels.get(project.id)!,
    }).toObject();
  }
}
