import Project from "#models/project";
import GitHubSyncService from "#services/github/github_sync_service";
import gitifyConfig from "#config/gitify";
import env from "#start/env";

export default class ShowcaseSeeder {
  async run() {
    const serverToken = env.get("GITHUB_SERVER_TOKEN");

    if (!serverToken) {
      console.log("GITHUB_SERVER_TOKEN not set — skipping showcase seeder");
      return;
    }

    const { languages, pool, seederDifficulty } = gitifyConfig.showcase;
    console.log(`Seeding ${languages.length} languages, ${pool} projects each...`);

    for (const language of languages) {
      console.log(`\n[${language}] Fetching top ${pool} repos...`);

      try {
        const count = await GitHubSyncService.fetchAndStore(language, seederDifficulty, serverToken, pool);
        console.log(`[${language}] Stored ${count} projects`);

        const projects = await Project.query()
          .where("language", language)
          .where("difficulty", seederDifficulty)
          .orderBy("stars", "desc")
          .limit(pool);

        console.log(`[${language}] Fetching details for ${projects.length} projects...`);

        for (const project of projects) {
          try {
            await GitHubSyncService.fetchProjectDetails(project, serverToken);
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
