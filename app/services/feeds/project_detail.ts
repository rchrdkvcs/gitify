import logger from "@adonisjs/core/services/logger";
import type Project from "#models/project";
import type GitHubSyncService from "#services/github/github_sync_service";
import type { ProjectDetail } from "#shared/types/index";
import { displayedDifficulties, favoriteProjectIds } from "#services/feeds/project_reader_state";
import { reachableProject } from "#services/feeds/visible_projects";
import ProjectDetailTransformer from "#transformers/project_detail_transformer";

type DetailSync = Pick<GitHubSyncService, "needsDetailsFetch" | "fetchProjectDetails">;

export type DetailReader = { userId: string | null; token: string | null };

export type ProjectDetailPage = {
  project: ProjectDetail;
  detailsPending: boolean;
  details: () => Promise<ProjectDetail>;
};

export default class ProjectDetailReader {
  constructor(private readonly sync: DetailSync) {}

  async read(
    ownerName: string,
    name: string,
    reader: DetailReader,
  ): Promise<ProjectDetailPage | null> {
    const project = await reachableProject(ownerName, name);
    if (!project) {
      return null;
    }
    const token = reader.token && this.sync.needsDetailsFetch(project) ? reader.token : null;
    const detail = await this.present(project, reader.userId);
    if (token && project.detailsFetchedAt) {
      void this.refresh(project, token);
    }
    const pendingToken = project.detailsFetchedAt ? null : token;
    return {
      project: detail,
      detailsPending: pendingToken !== null,
      details: async () => {
        if (!pendingToken) {
          return detail;
        }
        await this.refresh(project, pendingToken);
        return this.present(project, reader.userId);
      },
    };
  }

  private refresh(project: Project, token: string): Promise<void> {
    return this.sync
      .fetchProjectDetails(project, token)
      .catch((error) =>
        logger.error({ err: error, projectId: project.id }, "Project details refresh failed"),
      );
  }

  private async present(project: Project, userId: string | null): Promise<ProjectDetail> {
    await project.load("contributors", (query) =>
      query.orderBy("contributions", "desc").orderBy("id", "asc"),
    );
    const favoriteIds = await favoriteProjectIds([project], userId);
    const levels = await displayedDifficulties([project]);
    return new ProjectDetailTransformer(project, {
      isFavorite: favoriteIds.has(project.id),
      difficulty: levels.get(project.id)!,
    }).toObject();
  }
}
