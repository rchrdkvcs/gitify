import Contributor from "#models/contributor";
import GithubFetchCache from "#models/github_fetch_cache";
import Project from "#models/project";
import { DateTime } from "luxon";

interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

interface GitHubReadme {
  content: string;
  encoding: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  open_issues_count: number;
  has_issues: boolean;
}

interface GitHubRelease {
  tag_name: string;
}

export default class GitHubService {
  private static CACHE_TTL_HOURS = 24;
  private static DETAILS_CACHE_DAYS = 7;
  private static BASE_URL = "https://api.github.com/search/repositories";
  private static REPO_BASE_URL = "https://api.github.com/repos";

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
    perPage: number = 100,
  ): Promise<number> {
    const query = this.buildQuery(language, difficulty);
    const url = `${this.BASE_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

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
          forksCount: repo.forks_count,
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

  static needsDetailsFetch(project: Project): boolean {
    if (!project.detailsFetchedAt) {
      return true;
    }
    const daysSinceLastFetch = DateTime.now().diff(project.detailsFetchedAt, "days").days;
    return daysSinceLastFetch >= this.DETAILS_CACHE_DAYS;
  }

  static async fetchProjectDetails(project: Project, userGithubToken: string): Promise<void> {
    const headers = {
      Authorization: `Bearer ${userGithubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    };

    const baseUrl = `${this.REPO_BASE_URL}/${project.ownerName}/${project.name}`;

    const [
      readmeResponse,
      languagesResponse,
      contributorsResponse,
      releaseResponse,
      totalContributorsResponse,
    ] = await Promise.all([
      fetch(`${baseUrl}/readme`, { headers }),
      fetch(`${baseUrl}/languages`, { headers }),
      fetch(`${baseUrl}/contributors?per_page=10`, { headers }),
      fetch(`${baseUrl}/releases/latest`, { headers }),
      fetch(`${baseUrl}/contributors?per_page=1&anon=false`, { headers }),
    ]);

    let readme: string | null = null;
    if (readmeResponse.ok) {
      const readmeData = (await readmeResponse.json()) as GitHubReadme;
      readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
    }

    let languages: Record<string, number> | null = null;
    if (languagesResponse.ok) {
      languages = (await languagesResponse.json()) as Record<string, number>;
    }

    let contributors: GitHubContributor[] = [];
    if (contributorsResponse.ok) {
      const all = (await contributorsResponse.json()) as GitHubContributor[];
      contributors = all.filter((c) => c.type === "User");
    }

    let latestRelease: string | null = null;
    if (releaseResponse.ok) {
      const releaseData = (await releaseResponse.json()) as GitHubRelease;
      latestRelease = releaseData.tag_name;
    }

    let totalContributorsCount: number | null = null;
    if (totalContributorsResponse.ok) {
      const linkHeader = totalContributorsResponse.headers.get("link");
      if (linkHeader) {
        const lastMatch = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
        totalContributorsCount = lastMatch ? Number.parseInt(lastMatch[1], 10) : 1;
      } else {
        const items = (await totalContributorsResponse.json()) as unknown[];
        totalContributorsCount = items.length;
      }
    }

    project.readme = readme;
    project.languages = languages;
    project.latestRelease = latestRelease;
    project.totalContributorsCount = totalContributorsCount;
    project.detailsFetchedAt = DateTime.now();
    await project.save();

    await Promise.all(
      contributors.map((contributor) =>
        Contributor.updateOrCreate(
          { projectId: project.id, githubUserId: contributor.id },
          {
            login: contributor.login,
            avatarUrl: contributor.avatar_url,
            profileUrl: contributor.html_url,
            contributions: contributor.contributions,
          },
        ),
      ),
    );
  }
}
