import { BaseTransformer } from "@adonisjs/core/transformers";
import type Project from "#models/project";
import type { ProjectDetail } from "#shared/types/index";

export default class ProjectTransformer extends BaseTransformer<Project> {
  toObject(): ProjectDetail {
    const project = this.resource;
    return {
      ...this.pick(project, [
        "id",
        "name",
        "ownerName",
        "description",
        "repositoryUrl",
        "stars",
        "language",
        "topics",
        "openIssuesCount",
        "difficulty",
        "readme",
        "languages",
        "forksCount",
        "totalContributorsCount",
        "latestRelease",
      ]),
      isFavorite: project.isFavorite ?? false,
      createdAt: project.createdAt?.toISO() ?? null,
      updatedAt: project.updatedAt?.toISO() ?? null,
      contributors: (project.contributors ?? []).map((contributor) => ({
        id: contributor.id,
        login: contributor.login,
        avatarUrl: contributor.avatarUrl,
        profileUrl: contributor.profileUrl,
        contributions: contributor.contributions,
      })),
    };
  }
}
