import type {
  GitHubAdapter,
  GitHubContributor,
  GitHubIssue,
  GitHubRepo,
  ProjectDetails,
  RepositoryInsightsResult,
} from "#services/github/github_adapter";
import type {
  CommunityFiles,
  Difficulty,
  IssueKind,
  RepositoryIssue,
  RepositoryPullRequest,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { issueKindLabel } from "#shared/issues";
export type { GitHubRepo, ProjectDetails } from "#services/github/github_adapter";

const ISSUE_FIELDS = `number title url createdAt
  author { login avatarUrl }
  comments { totalCount }
  labels(first: 6) { nodes { name color } }`;

const contributingAliases = gitifyConfig.github.insights.contributingPaths
  .map(
    (path, index) =>
      `contributing${index}: object(expression: "HEAD:${path}") { ... on Blob { text } }`,
  )
  .join("\n");

const INSIGHTS_QUERY = `query RepositoryInsights($owner: String!, $name: String!, $issues: Int!, $pullRequests: Int!, $languages: Int!) {
  repository(owner: $owner, name: $name) {
    createdAt pushedAt homepageUrl isArchived diskUsage stargazerCount forkCount
    owner { avatarUrl }
    licenseInfo { spdxId name }
    watchers { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    openPullRequests: pullRequests(states: OPEN) { totalCount }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    goodFirstIssues: issues(states: OPEN, labels: ["good first issue"]) { totalCount }
    helpWantedIssues: issues(states: OPEN, labels: ["help wanted"]) { totalCount }
    releases { totalCount }
    latestRelease { publishedAt }
    languages(first: $languages, orderBy: { field: SIZE, direction: DESC }) {
      edges { size node { name color } }
    }
    defaultBranchRef {
      name
      target { ... on Commit { committedDate history { totalCount } } }
    }
    recentIssues: issues(first: $issues, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ISSUE_FIELDS} }
    }
    beginnerIssues: issues(first: $issues, states: OPEN, labels: ["good first issue"], orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ISSUE_FIELDS} }
    }
    recentPullRequests: pullRequests(first: $pullRequests, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { isDraft ${ISSUE_FIELDS} }
    }
    ${contributingAliases}
  }
}`;

// Search results are a union; non-issue nodes come back as empty objects.
const ISSUE_SEARCH_QUERY = `query IssueSearch($query: String!, $first: Int!, $labels: Int!, $topics: Int!) {
  search(type: ISSUE, query: $query, first: $first) {
    nodes {
      ... on Issue {
        databaseId number title url createdAt
        comments { totalCount }
        assignees { totalCount }
        closedByPullRequestsReferences(first: 1, includeClosedPrs: false) { totalCount }
        labels(first: $labels) { nodes { name color } }
        repository {
          databaseId name url description homepageUrl pushedAt createdAt
          isArchived isPrivate stargazerCount forkCount
          owner { login avatarUrl }
          primaryLanguage { name }
          licenseInfo { spdxId name }
          repositoryTopics(first: $topics) { nodes { topic { name } } }
          issues(states: OPEN) { totalCount }
          pullRequests(states: OPEN) { totalCount }
        }
      }
    }
  }
}`;

type GraphQLSearchIssue = {
  databaseId?: number;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  comments: { totalCount: number };
  assignees: { totalCount: number };
  closedByPullRequestsReferences: { totalCount: number } | null;
  labels: { nodes: { name: string; color: string }[] };
  repository: {
    databaseId: number;
    name: string;
    url: string;
    description: string | null;
    homepageUrl: string | null;
    pushedAt: string | null;
    createdAt: string | null;
    isArchived: boolean;
    isPrivate: boolean;
    stargazerCount: number;
    forkCount: number;
    owner: { login: string; avatarUrl: string | null };
    primaryLanguage: { name: string } | null;
    licenseInfo: { spdxId: string | null; name: string } | null;
    repositoryTopics: { nodes: { topic: { name: string } }[] };
    issues: { totalCount: number };
    pullRequests: { totalCount: number };
  };
};

function licenseName(license: { spdxId: string | null; name: string } | null): string | null {
  if (!license) {
    return null;
  }
  return license.spdxId && license.spdxId !== "NOASSERTION" ? license.spdxId : license.name;
}

type GraphQLIssue = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  author: { login: string; avatarUrl: string } | null;
  comments: { totalCount: number };
  labels: { nodes: { name: string; color: string }[] };
  isDraft?: boolean;
};

type GraphQLRepository = {
  createdAt: string;
  pushedAt: string | null;
  homepageUrl: string | null;
  isArchived: boolean;
  diskUsage: number | null;
  stargazerCount: number;
  forkCount: number;
  owner: { avatarUrl: string };
  licenseInfo: { spdxId: string | null; name: string } | null;
  watchers: { totalCount: number };
  openIssues: { totalCount: number };
  closedIssues: { totalCount: number };
  openPullRequests: { totalCount: number };
  mergedPullRequests: { totalCount: number };
  goodFirstIssues: { totalCount: number };
  helpWantedIssues: { totalCount: number };
  releases: { totalCount: number };
  latestRelease: { publishedAt: string | null } | null;
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
  defaultBranchRef: {
    name: string;
    target: { committedDate?: string; history?: { totalCount: number } } | null;
  } | null;
  recentIssues: { nodes: GraphQLIssue[] };
  beginnerIssues: { nodes: GraphQLIssue[] };
  recentPullRequests: { nodes: GraphQLIssue[] };
} & Record<`contributing${number}`, { text?: string | null } | null>;

function toIssue(issue: GraphQLIssue): RepositoryIssue {
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    createdAt: issue.createdAt,
    author: issue.author ? { login: issue.author.login, avatarUrl: issue.author.avatarUrl } : null,
    comments: issue.comments.totalCount,
    labels: issue.labels.nodes.map((label) => ({ name: label.name, color: label.color })),
  };
}

function toPullRequest(pullRequest: GraphQLIssue): RepositoryPullRequest {
  return { ...toIssue(pullRequest), isDraft: pullRequest.isDraft ?? false };
}

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

  /** Open public issues of active repositories, without a pull request that already closes them. */
  buildIssueSearchQuery(language: string, kind: IssueKind): string {
    return `is:issue is:open is:public archived:false -linked:pr language:${language} label:"${issueKindLabel(kind)}" sort:created-desc`;
  }

  async searchIssues(
    language: string,
    kind: IssueKind,
    token: string,
    perPage: number = gitifyConfig.github.issues.searchPerPage,
  ): Promise<GitHubIssue[]> {
    const result = await this.requestJson(
      gitifyConfig.github.graphqlUrl,
      this.buildHeaders(token),
      {
        body: {
          query: ISSUE_SEARCH_QUERY,
          variables: {
            query: this.buildIssueSearchQuery(language, kind),
            first: perPage,
            labels: gitifyConfig.github.issues.labelsLimit,
            topics: gitifyConfig.github.issues.topicsLimit,
          },
        },
      },
    );
    const payload = result!.data as {
      data?: { search?: { nodes?: unknown } | null };
      errors?: { message?: string }[];
    };
    const nodes = payload?.data?.search?.nodes;
    if (!Array.isArray(nodes)) {
      const reason = payload?.errors?.[0]?.message ?? "missing search";
      throw new Error(`Invalid GitHub response: issues (${reason})`);
    }

    return (nodes as GraphQLSearchIssue[])
      .filter((node) => typeof node?.databaseId === "number" && node.repository)
      .map((issue) => {
        const repo = issue.repository;
        return {
          id: issue.databaseId!,
          number: issue.number,
          title: issue.title,
          url: issue.url,
          createdAt: issue.createdAt,
          comments: issue.comments.totalCount,
          assignees: issue.assignees.totalCount,
          linkedPullRequests: issue.closedByPullRequestsReferences?.totalCount ?? 0,
          labels: issue.labels.nodes.map((label) => ({ name: label.name, color: label.color })),
          repository: {
            id: repo.databaseId,
            name: repo.name,
            ownerLogin: repo.owner.login,
            ownerAvatarUrl: repo.owner.avatarUrl,
            url: repo.url,
            description: repo.description,
            stars: repo.stargazerCount,
            forksCount: repo.forkCount,
            openIssuesCount: repo.issues.totalCount + repo.pullRequests.totalCount,
            language: repo.primaryLanguage?.name ?? null,
            topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
            homepageUrl: repo.homepageUrl || null,
            license: licenseName(repo.licenseInfo),
            pushedAt: repo.pushedAt,
            createdAt: repo.createdAt,
            isArchived: repo.isArchived,
            isPrivate: repo.isPrivate,
          },
        };
      });
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

  async getRepositoryInsights(
    ownerName: string,
    repoName: string,
    token: string,
  ): Promise<RepositoryInsightsResult> {
    const headers = this.buildHeaders(token);
    const base = `${gitifyConfig.github.repoBaseUrl}/${ownerName}/${repoName}`;
    const limits = gitifyConfig.github.insights;

    const [graphqlResult, communityResult, activityResult] = await Promise.all([
      this.requestJson(gitifyConfig.github.graphqlUrl, headers, {
        body: {
          query: INSIGHTS_QUERY,
          variables: {
            owner: ownerName,
            name: repoName,
            issues: limits.issuesLimit,
            pullRequests: limits.pullRequestsLimit,
            languages: limits.languagesLimit,
          },
        },
      }),
      this.requestJson(`${base}/community/profile`, headers, { optional: true }),
      // GitHub answers 202 while it computes statistics, and 204 for empty repositories.
      this.requestJson(`${base}/stats/commit_activity`, headers, { allowPending: true }),
    ]);

    const payload = graphqlResult!.data as {
      data?: { repository?: GraphQLRepository | null };
      errors?: { message?: string }[];
    };
    const repo = payload?.data?.repository;
    if (!repo || typeof repo.stargazerCount !== "number") {
      const reason = payload?.errors?.[0]?.message ?? "missing repository";
      throw new Error(`Invalid GitHub response: insights (${reason})`);
    }

    const community = communityResult?.data as
      | { health_percentage?: unknown; files?: Record<string, unknown> }
      | undefined;
    const files = community?.files ?? {};
    const health =
      community && typeof community.health_percentage === "number"
        ? {
            percentage: community.health_percentage,
            files: {
              readme: !!files.readme,
              contributing: !!files.contributing,
              codeOfConduct: !!files.code_of_conduct,
              license: !!files.license,
              issueTemplate: !!files.issue_template,
              pullRequestTemplate: !!files.pull_request_template,
            } satisfies CommunityFiles,
          }
        : null;

    const activity = activityResult?.data;
    const weeklyCommits = Array.isArray(activity)
      ? activity.map((week: { total?: unknown }) =>
          typeof week?.total === "number" ? week.total : 0,
        )
      : null;

    const contributing =
      limits.contributingPaths
        .map((_, index) => repo[`contributing${index}`]?.text)
        .find((text): text is string => typeof text === "string" && text.trim() !== "") ??
      (await this.fetchCommunityFile(files.contributing, headers));

    const target = repo.defaultBranchRef?.target;
    return {
      contributing,
      metadata: {
        ownerAvatarUrl: repo.owner.avatarUrl,
        homepageUrl: repo.homepageUrl || null,
        license: licenseName(repo.licenseInfo),
        pushedAt: repo.pushedAt,
        createdAt: repo.createdAt,
        stars: repo.stargazerCount,
        forksCount: repo.forkCount,
      },
      insights: {
        watchers: repo.watchers.totalCount,
        openIssues: repo.openIssues.totalCount,
        closedIssues: repo.closedIssues.totalCount,
        openPullRequests: repo.openPullRequests.totalCount,
        mergedPullRequests: repo.mergedPullRequests.totalCount,
        goodFirstIssues: repo.goodFirstIssues.totalCount,
        helpWantedIssues: repo.helpWantedIssues.totalCount,
        commits: target?.history?.totalCount ?? null,
        releases: repo.releases.totalCount,
        latestReleaseAt: repo.latestRelease?.publishedAt ?? null,
        diskUsageKb: repo.diskUsage,
        defaultBranch: repo.defaultBranchRef?.name ?? null,
        isArchived: repo.isArchived,
        lastCommitAt: target?.committedDate ?? repo.pushedAt,
        languages: repo.languages.edges.map((edge) => ({
          name: edge.node.name,
          color: edge.node.color,
          bytes: edge.size,
        })),
        weeklyCommits,
        health,
        issues: repo.recentIssues.nodes.map(toIssue),
        beginnerIssues: repo.beginnerIssues.nodes.map(toIssue),
        pullRequests: repo.recentPullRequests.nodes.map(toPullRequest),
      },
    };
  }

  /**
   * Organisations can share community files from their `.github` repository; GitHub's
   * community profile points at the file actually in use.
   */
  private async fetchCommunityFile(
    file: unknown,
    headers: Record<string, string>,
  ): Promise<string | null> {
    const htmlUrl = (file as { html_url?: unknown } | null)?.html_url;
    const match =
      typeof htmlUrl === "string"
        ? /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/.exec(htmlUrl)
        : null;
    if (!match) {
      return null;
    }
    const [, owner, repo, ref, path] = match;
    const result = await this.requestJson(
      `${gitifyConfig.github.repoBaseUrl}/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      headers,
      { optional: true },
    );
    const data = result?.data as { content?: unknown; encoding?: unknown } | undefined;
    return typeof data?.content === "string" && data.encoding === "base64"
      ? Buffer.from(data.content, "base64").toString("utf-8")
      : null;
  }

  /** Owns the complete request, including body consumption, and only treats documented absence as success. */
  private async requestJson(
    url: string,
    headers: Record<string, string>,
    {
      optional = false,
      allowEmptyContributors = false,
      allowPending = false,
      body,
    }: {
      optional?: boolean;
      allowEmptyContributors?: boolean;
      allowPending?: boolean;
      body?: unknown;
    } = {},
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
          const response = await this.request(
            url,
            body === undefined
              ? { headers, signal: controller.signal }
              : {
                  method: "POST",
                  headers: { ...headers, "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                  signal: controller.signal,
                },
          );
          if (allowPending && (response.status === 202 || response.status === 204)) {
            await response.body?.cancel();
            return response.status === 204 ? { data: [], headers: response.headers } : null;
          }
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
