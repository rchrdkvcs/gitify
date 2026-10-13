import { BaseTransformer } from "@adonisjs/core/transformers";
import type Project from "#models/project";
import type { Difficulty, Project as ProjectList } from "#shared/types/index";

export type ProjectReaderState = { isFavorite: boolean; difficulty: Difficulty };

export default class ProjectTransformer extends BaseTransformer<Project> {
  constructor(
    project: Project,
    private readonly reader: ProjectReaderState,
  ) {
    super(project);
  }

  toObject(): ProjectList {
    const project = this.resource;
    return {
      id: project.id,
      name: project.name,
      ownerName: project.ownerName,
      ownerAvatarUrl: project.avatarUrl,
      description: project.description,
      repositoryUrl: project.repositoryUrl,
      stars: project.stars,
      forksCount: project.forksCount,
      language: project.language,
      topics: project.topics,
      openIssuesCount: project.openIssuesCount,
      difficulty: this.reader.difficulty,
      isFavorite: this.reader.isFavorite,
      latestRelease: project.latestRelease,
      pushedAt: project.pushedAt?.toISO() ?? null,
      newcomerScore: project.newcomerScoreDetails
        ? {
            score: project.newcomerScoreDetails.score,
            partial: project.newcomerScoreDetails.partial,
            archived: project.newcomerScoreDetails.archived,
          }
        : null,
    };
  }
}
