import Project from "#models/project";
import GitHubService from "#services/git_hub_service";
import env from "#start/env";

const SHOWCASE_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "c++",
  "php",
  "java",
  "kotlin",
  "swift",
  "dart",
  "ruby",
];

const PER_PAGE = 30;
const DIFFICULTY = "expert" as const;

export default class ShowcaseSeeder {
  async run() {
    const serverToken = env.get("GITHUB_SERVER_TOKEN");

    if (!serverToken) {
      console.log("GITHUB_SERVER_TOKEN not set — skipping showcase seeder");
      return;
    }

    console.log(`Seeding ${SHOWCASE_LANGUAGES.length} languages, ${PER_PAGE} projects each...`);

    for (const language of SHOWCASE_LANGUAGES) {
      console.log(`\n[${language}] Fetching top ${PER_PAGE} repos...`);

      try {
        const count = await GitHubService.fetchAndStore(
          language,
          DIFFICULTY,
          serverToken,
          PER_PAGE,
        );
        console.log(`[${language}] Stored ${count} projects`);

        const projects = await Project.query()
          .where("language", language)
          .where("difficulty", DIFFICULTY)
          .orderBy("stars", "desc")
          .limit(PER_PAGE);

        console.log(`[${language}] Fetching details for ${projects.length} projects...`);

        for (const project of projects) {
          try {
            await GitHubService.fetchProjectDetails(project, serverToken);
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
