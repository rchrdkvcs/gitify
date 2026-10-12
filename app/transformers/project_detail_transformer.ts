import type { ProjectDetail } from "#shared/types/index";
import ProjectTransformer from "#transformers/project_transformer";

export default class ProjectDetailTransformer extends ProjectTransformer {
  toObject(): ProjectDetail {
    const project = this.resource;
    return {
      ...super.toObject(),
      readme: project.readme,
      contributing: project.contributing,
      homepageUrl: project.homepageUrl,
      license: project.license,
      totalContributorsCount: project.totalContributorsCount,
      githubCreatedAt: project.githubCreatedAt?.toISO() ?? null,
      detailsFetchedAt: project.detailsFetchedAt?.toISO() ?? null,
      insights: project.insights,
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
