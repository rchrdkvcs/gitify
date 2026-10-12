import type { ProjectDetail } from "#shared/types/index";
import ProjectTransformer from "#transformers/project_transformer";

export default class ProjectDetailTransformer extends ProjectTransformer {
  toObject(): ProjectDetail {
    const project = this.resource;
    return {
      ...super.toObject(),
      readme: project.readme,
      languages: project.languages,
      forksCount: project.forksCount,
      totalContributorsCount: project.totalContributorsCount,
      createdAt: project.createdAt?.toISO() ?? null,
      contributors: project.contributors.map((contributor) => ({
        id: contributor.id,
        login: contributor.login,
        avatarUrl: contributor.avatarUrl,
        profileUrl: contributor.profileUrl,
        contributions: contributor.contributions,
      })),
    };
  }
}
