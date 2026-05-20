import type { Difficulty } from "@gitify/types";
import gitifyConfig from "#config/gitify";

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

export interface GitHubRepo {
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

export interface ProjectDetails {
  readme: string | null;
  languages: Record<string, number> | null;
  contributors: GitHubContributor[];
  latestRelease: string | null;
  totalContributorsCount: number;
}

export default class GitHubApiClient {
  static buildHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: gitifyConfig.github.acceptHeader,
      "X-GitHub-Api-Version": gitifyConfig.github.apiVersion,
    };
  }

  static buildSearchQuery(language: string, difficulty: Difficulty): string {
    const base = `language:${language} archived:false is:public`;
    if (difficulty === "beginner") {
      return `${base} good-first-issues:>0`;
    }
    return `${base} stars:>${gitifyConfig.github.search.expertMinStars} help-wanted-issues:>0`;
  }

  static async searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage: number = gitifyConfig.github.search.defaultPerPage,
  ): Promise<GitHubRepo[]> {
    const query = this.buildSearchQuery(language, difficulty);
    const url = `${gitifyConfig.github.baseUrl}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

    const res = await fetch(url, {
      headers: {
        ...this.buildHeaders(token),
        Accept: gitifyConfig.github.textMatchAcceptHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { items: GitHubRepo[] };
    return data.items;
  }

  static async getProjectDetails(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<ProjectDetails> {
    const headers = this.buildHeaders(token);
    const base = `${gitifyConfig.github.repoBaseUrl}/${ownerName}/${repoName}`;

    const [readmeRes, languagesRes, contributorsRes, releaseRes, totalContribRes] =
      await Promise.all([
        fetch(`${base}/readme`, { headers }),
        fetch(`${base}/languages`, { headers }),
        fetch(`${base}/contributors?per_page=${gitifyConfig.github.contributors.topContributorsLimit}`, { headers }),
        fetch(`${base}/releases/latest`, { headers }),
        fetch(`${base}/contributors?per_page=1&anon=false`, { headers }),
      ]);

    const readme = readmeRes.ok
      ? Buffer.from(((await readmeRes.json()) as GitHubReadme).content, "base64").toString("utf-8")
      : null;

    const languages = languagesRes.ok
      ? ((await languagesRes.json()) as Record<string, number>)
      : null;

    const contributors = contributorsRes.ok
      ? ((await contributorsRes.json()) as GitHubContributor[]).filter((c) => c.type === "User")
      : [];

    const latestRelease = releaseRes.ok
      ? ((await releaseRes.json()) as GitHubRelease).tag_name
      : null;

    const totalContributorsCount = totalContribRes.ok
      ? await this.parseTotalContributors(totalContribRes)
      : 0;

    return { readme, languages, contributors, latestRelease, totalContributorsCount };
  }

  private static async parseTotalContributors(response: Response): Promise<number> {
    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      const lastMatch = new RegExp(/[?&]page=(\d+)>; rel="last"/).exec(linkHeader);
      return lastMatch ? Number.parseInt(lastMatch[1], 10) : 1;
    }
    const items = (await response.json()) as unknown[];
    return items.length;
  }
}
