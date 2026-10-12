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
      description: project.description,
      repositoryUrl: project.repositoryUrl,
      stars: project.stars,
      language: project.language,
      topics: project.topics,
      openIssuesCount: project.openIssuesCount,
      difficulty: this.reader.difficulty,
      isFavorite: this.reader.isFavorite,
      latestRelease: project.latestRelease,
      updatedAt: project.updatedAt?.toISO() ?? null,
    };
  }
}
