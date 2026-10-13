import { BaseTransformer } from "@adonisjs/core/transformers";
import type Project from "#models/project";
import type { ShowcaseProject } from "#shared/types/index";
import gitifyConfig from "#config/gitify";

export default class ShowcaseProjectTransformer extends BaseTransformer<Project> {
  toObject(): ShowcaseProject {
    const project = this.resource;
    return {
      id: project.id,
      name: project.name,
      ownerName: project.ownerName,
      ownerAvatarUrl: project.avatarUrl,
      repositoryUrl: project.repositoryUrl,
      description: project.description,
      language: project.language,
      stars: project.stars,
      latestRelease: project.latestRelease,
      pushedAt: project.pushedAt?.toISO() ?? null,
      topics: project.topics?.slice(0, gitifyConfig.showcase.topicsDisplay) ?? [],
      totalContributorsCount: project.totalContributorsCount,
      contributors: project.contributors
        .slice(0, gitifyConfig.showcase.topContributorsDisplay)
        .map((contributor) => ({
          login: contributor.login,
          avatarUrl: contributor.avatarUrl,
          profileUrl: contributor.profileUrl,
        })),
    };
  }
}
