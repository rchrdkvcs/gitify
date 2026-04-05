import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import { DateTime } from "luxon";

interface GitHubRepo {
  id: number;
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  open_issues_count: number;
  has_issues: boolean;
}

export default class GitHubService {
  private static CACHE_TTL_HOURS = 24;
  private static BASE_URL = "https://api.github.com/search/repositories";

  private static buildQuery(language: string, difficulty: "beginner" | "expert"): string {
    const base = `language:${language} archived:false is:public`;

    if (difficulty === "beginner") {
      return `${base} good-first-issues:>0`;
    }

    return `${base} stars:>1000 help-wanted-issues:>0`;
  }

  static async needsFetch(language: string, difficulty: "beginner" | "expert"): Promise<boolean> {
    const cache = await GithubFetchCache.query()
      .where("language", language.toLowerCase())
      .where("difficulty", difficulty)
      .first();

    if (!cache) {
      return true;
    }

    const hoursSinceLastFetch = DateTime.now().diff(cache.fetchedAt, "hours").hours;
    return hoursSinceLastFetch >= this.CACHE_TTL_HOURS;
  }

  static async fetchAndStore(
    language: string,
    difficulty: "beginner" | "expert",
    userGithubToken: string,
  ): Promise<any> {
    const query = this.buildQuery(language, difficulty);
    const url = `${this.BASE_URL}?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100`;

    const githubResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${userGithubToken}`,
        Accept: "application/vnd.github.text-match+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
    });

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResponse.status} ${githubResponse.statusText}`);
    }

    const data = (await githubResponse.json()) as { items: GitHubRepo[] };

    // Filters out pull requests with no actual issues (GitHub counts PRs in `open_issues_count`)
    let validRepos = data.items.filter((repo) => repo.has_issues && repo.open_issues_count > 0);

    let storedCount = 0;

    for (const repo of validRepos) {
      await Project.updateOrCreate(
        { githubRepoId: repo.id },
        {
          ownerName: repo.owner.login,
          name: repo.name,
          description: repo.description,
          repositoryUrl: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language?.toLowerCase() ?? language,
          topics: repo.topics ?? [],
          openIssuesCount: repo.open_issues_count,
          difficulty,
        },
      );
      storedCount++;
    }

    await GithubFetchCache.updateOrCreate(
      { language: language.toLowerCase(), difficulty },
      {
        totalStored: storedCount,
        fetchedAt: DateTime.now(),
      },
    );

    return storedCount;
  }
}
