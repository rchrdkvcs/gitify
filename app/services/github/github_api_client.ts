import type {
  GitHubAdapter,
  GitHubContributor,
  GitHubRepo,
  ProjectDetails,
} from "#services/github/github_adapter";
import type { Difficulty } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
export type { GitHubRepo, ProjectDetails } from "#services/github/github_adapter";

export class GitHubApiClient implements GitHubAdapter {
  constructor(
    private readonly request: typeof fetch = globalThis.fetch,
    private readonly timeoutMs = 10_000,
  ) {}

  buildHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: gitifyConfig.github.acceptHeader,
      "X-GitHub-Api-Version": gitifyConfig.github.apiVersion,
    };
  }

  buildSearchQuery(language: string, difficulty: Difficulty): string {
    const base = `language:${language} archived:false is:public`;
    if (difficulty === "beginner") {
      return `${base} good-first-issues:>0`;
    }
    return `${base} stars:>${gitifyConfig.github.search.expertMinStars} help-wanted-issues:>0`;
  }

  async searchRepositories(
    language: string,
    difficulty: Difficulty,
    token: string,
    perPage: number = gitifyConfig.github.search.defaultPerPage,
  ): Promise<GitHubRepo[]> {
    const query = this.buildSearchQuery(language, difficulty);
    const url = `${gitifyConfig.github.baseUrl}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

    const result = await this.requestJson(url, {
      ...this.buildHeaders(token),
      Accept: gitifyConfig.github.textMatchAcceptHeader,
    });
    const data = result!.data as { items?: unknown };
    if (!data || !Array.isArray(data.items)) {
      throw new Error("Invalid GitHub response: repositories");
    }
    return data.items as GitHubRepo[];
  }

  async getProjectDetails(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<ProjectDetails> {
    const headers = this.buildHeaders(token);
    const base = `${gitifyConfig.github.repoBaseUrl}/${ownerName}/${repoName}`;

    const [readmeResult, languagesResult, contributorsResult, releaseResult, totalResult] =
      await Promise.all([
        this.requestJson(`${base}/readme`, headers, { optional: true }),
        this.requestJson(`${base}/languages`, headers),
        this.requestJson(
          `${base}/contributors?per_page=${gitifyConfig.github.contributors.topContributorsLimit}`,
          headers,
          { allowEmptyContributors: true },
        ),
        this.requestJson(`${base}/releases/latest`, headers, { optional: true }),
        this.requestJson(`${base}/contributors?per_page=1&anon=false`, headers, {
          allowEmptyContributors: true,
        }),
      ]);

    const readmeData = readmeResult?.data as { content?: unknown; encoding?: unknown } | undefined;
    if (
      readmeResult &&
      (typeof readmeData?.content !== "string" || readmeData.encoding !== "base64")
    ) {
      throw new Error("Invalid GitHub response: README");
    }
    const readme = readmeData
      ? Buffer.from(readmeData.content as string, "base64").toString("utf-8")
      : null;

    const languages = languagesResult!.data;
    if (
      !languages ||
      typeof languages !== "object" ||
      Array.isArray(languages) ||
      Object.values(languages).some(
        (count) => typeof count !== "number" || !Number.isFinite(count) || count < 0,
      )
    ) {
      throw new Error("Invalid GitHub response: languages");
    }
    const contributorData = contributorsResult!.data;
    if (
      !Array.isArray(contributorData) ||
      contributorData.some(
        (c) =>
          !c ||
          typeof c.id !== "number" ||
          !Number.isInteger(c.id) ||
          typeof c.login !== "string" ||
          typeof c.avatar_url !== "string" ||
          typeof c.html_url !== "string" ||
          typeof c.type !== "string" ||
          !Number.isInteger(c.contributions) ||
          c.contributions < 0,
      )
    ) {
      throw new Error("Invalid GitHub response: contributors");
    }
    const contributors = (contributorData as GitHubContributor[]).filter((c) => c.type === "User");
    const releaseData = releaseResult?.data as { tag_name?: unknown } | undefined;
    if (releaseResult && typeof releaseData?.tag_name !== "string") {
      throw new Error("Invalid GitHub response: release");
    }
    const latestRelease = releaseData ? (releaseData.tag_name as string) : null;

    if (!Array.isArray(totalResult!.data)) {
      throw new Error("Invalid GitHub response: contributor count");
    }
    const linkHeader = totalResult!.headers.get("link");
    const lastMatch = linkHeader ? /[?&]page=(\d+)>; rel="last"/.exec(linkHeader) : null;
    const totalContributorsCount = lastMatch
      ? Number.parseInt(lastMatch[1], 10)
      : totalResult!.data.length;

    return {
      readme,
      languages: languages as Record<string, number>,
      contributors,
      latestRelease,
      totalContributorsCount,
    };
  }

  /** Owns the complete request, including body consumption, and only treats documented absence as success. */
  private async requestJson(
    url: string,
    headers: Record<string, string>,
    { optional = false, allowEmptyContributors = false } = {},
  ): Promise<{ data: unknown; headers: Headers } | null> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        const error = new Error("GitHub request timed out");
        controller.abort(error);
        reject(error);
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([
        (async () => {
          const response = await this.request(url, { headers, signal: controller.signal });
          // GitHub documents 204 for contributors of an empty repository.
          if (allowEmptyContributors && response.status === 204) {
            return { data: [], headers: response.headers };
          }
          if (optional && response.status === 404) {
            await response.body?.cancel();
            return null;
          }
          if (!response.ok) {
            await response.body?.cancel();
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
          }
          return { data: await response.json(), headers: response.headers };
        })(),
        deadline,
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default new GitHubApiClient();
