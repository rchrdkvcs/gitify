import app from "@adonisjs/core/services/app";
import gitifyConfig from "#config/gitify";
import { listedProjects } from "#services/feeds/visible_projects";
import GitHubCredentials from "#services/github/github_credentials";
import GitHubSyncService from "#services/github/github_sync_service";

export default class ShowcaseSeeder {
  async run() {
    const credentials = await app.container.make(GitHubCredentials);
    const serverToken = credentials.server().token;

    if (!serverToken) {
      console.log("GITHUB_SERVER_TOKEN not set — skipping showcase seeder");
      return;
    }

    const sync = await app.container.make(GitHubSyncService);
    const { languages, pool, seederDifficulty } = gitifyConfig.showcase;
    console.log(
      `Seeding ${languages.length} languages, ${gitifyConfig.github.search.defaultPerPage} search results each...`,
    );

    for (const language of languages) {
      console.log(
        `\n[${language}] Fetching top ${gitifyConfig.github.search.defaultPerPage} repos...`,
      );

      try {
        const count = await sync.fetchAndStore(language, seederDifficulty, serverToken);
        console.log(`[${language}] Stored ${count} projects`);

        const projects = await listedProjects({ languages: [language], level: seederDifficulty })
          .orderBy("stars", "desc")
          .limit(pool);

        console.log(`[${language}] Fetching details for ${projects.length} projects...`);

        for (const project of projects) {
          try {
            await sync.fetchProjectDetails(project, serverToken);
          } catch (error) {
            console.warn(`[${language}] Failed details for ${project.name}:`, error);
          }
        }

        console.log(`[${language}] Done`);
      } catch (error) {
        console.error(`[${language}] Failed:`, error);
      }
    }

    console.log("\nShowcase seeder complete.");
  }
}
