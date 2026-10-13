import logger from "@adonisjs/core/services/logger";
import type Project from "#models/project";
import type GitHubSyncService from "#services/github/github_sync_service";
import type { ShowcaseLanguageResult } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { listedProjectCards } from "#services/feeds/visible_projects";
import ShowcaseProjectTransformer from "#transformers/showcase_project_transformer";

type ShowcaseSync = Pick<
  GitHubSyncService,
  "revalidateSearch" | "needsDetailsFetch" | "fetchProjectDetails"
>;

export type RandomSource = () => number;

export default class ProjectShowcase {
  constructor(
    private readonly sync: ShowcaseSync,
    private readonly random: RandomSource = Math.random,
  ) {}

  async languages(serverToken?: string | null): Promise<ShowcaseLanguageResult[]> {
    const detailsReserved = new Set<string>();
    const results = await Promise.all(
      gitifyConfig.showcase.languages.map(async (language) => {
        if (serverToken) {
          await this.refreshSearch(language, serverToken);
        }
        const selected = this.pickRandom(await this.pool(language));
        if (serverToken) {
          await this.refreshDetails(selected, detailsReserved, serverToken);
        }
        return {
          language,
          projects: selected.map((project) => new ShowcaseProjectTransformer(project).toObject()),
        };
      }),
    );
    return results.filter((result) => result.projects.length > 0);
  }

  private async refreshSearch(language: string, token: string): Promise<void> {
    await this.sync
      .revalidateSearch({ language, difficulty: gitifyConfig.showcase.seederDifficulty, token })
      .catch((error) => logger.error({ err: error, language }, "Showcase search refresh failed"));
  }

  private pool(language: string): Promise<Project[]> {
    return listedProjectCards({ languages: [language], level: "all" })
      .orderBy("stars", "desc")
      .limit(gitifyConfig.showcase.pool)
      .preload("contributors", (query) =>
        query.orderBy("contributions", "desc").orderBy("id", "asc"),
      );
  }

  private async refreshDetails(
    projects: Project[],
    reserved: Set<string>,
    token: string,
  ): Promise<void> {
    for (const project of projects) {
      if (reserved.size >= gitifyConfig.showcase.detailsRefreshLimit) {
        return;
      }
      if (reserved.has(project.id) || !this.sync.needsDetailsFetch(project)) {
        continue;
      }
      reserved.add(project.id);
      await this.sync
        .fetchProjectDetails(project, token)
        .catch((error) =>
          logger.error({ err: error, projectId: project.id }, "Showcase details refresh failed"),
        );
      await project.load("contributors", (query) =>
        query.orderBy("contributions", "desc").orderBy("id", "asc"),
      );
    }
  }

  private pickRandom<T>(items: T[]): T[] {
    return items
      .map((item) => ({ item, sort: this.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, gitifyConfig.showcase.perLanguage)
      .map(({ item }) => item);
  }
}
