import type { ActivitySampleItem } from "#services/github/contributor_activity";
import type { RepositorySnapshot } from "#services/github/github_adapter";
import type { GitHubTransport } from "#services/github/github_transport";
import type {
  RepositoryInsights,
  RepositoryIssue,
  RepositoryPullRequest,
} from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { REPOSITORY_GRAPH_QUERY } from "#services/github/github_queries";
import { type LicenseInfo, homepageUrl, licenseName } from "#services/github/repository_fields";

type Count = { totalCount: number };

type GraphQLIssue = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  author: { login: string; avatarUrl: string } | null;
  comments: Count;
  labels: { nodes: { name: string; color: string }[] };
  isDraft?: boolean;
  assignees?: Count;
};

type GraphQLReply = { createdAt: string; authorAssociation: string };

type GraphQLActivityItem = {
  createdAt: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  authorAssociation: string;
  author: { __typename: string } | null;
  comments: { nodes: GraphQLReply[] };
  mergedAt?: string | null;
  reviews?: { nodes: GraphQLReply[] };
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
  licenseInfo: LicenseInfo;
  watchers: Count;
  openIssues: Count;
  closedIssues: Count;
  openPullRequests: Count;
  mergedPullRequests: Count;
  goodFirstIssues: Count;
  helpWantedIssues: Count;
  releases: Count;
  latestRelease: { publishedAt: string | null } | null;
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
  defaultBranchRef: {
    name: string;
    target: { committedDate?: string; history?: Count } | null;
  } | null;
  recentIssues: { nodes: GraphQLIssue[] };
  beginnerIssues: { nodes: GraphQLIssue[] };
  recentPullRequests: { nodes: GraphQLIssue[] };
  activityIssues?: { nodes: GraphQLActivityItem[] };
  activityPullRequests?: { nodes: GraphQLActivityItem[] };
  lastMergedPullRequest?: { nodes: { mergedAt: string | null }[] };
} & Record<`contributing${number}`, { text?: string | null } | null>;

export type ActivitySample = {
  items: ActivitySampleItem[];
  lastMergedPullRequestAt: string | null;
  unassignedGoodFirstIssues: number;
};

export type RepositoryGraph = {
  repository: RepositorySnapshot["repository"];
  insights: Omit<RepositoryInsights, "weeklyCommits" | "health" | "contributorActivity">;
  contributing: string | null;
  activity: ActivitySample | null;
};

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

function toActivityItem(kind: "issue" | "pull", item: GraphQLActivityItem): ActivitySampleItem {
  return {
    kind,
    createdAt: item.createdAt,
    authorAssociation: item.authorAssociation,
    automated: !item.author || item.author.__typename === "Bot",
    state: item.state,
    mergedAt: item.mergedAt ?? null,
    replies: [...item.comments.nodes, ...(item.reviews?.nodes ?? [])],
  };
}

function activitySample(repo: GraphQLRepository): ActivitySample | null {
  if (!repo.activityIssues || !repo.activityPullRequests) {
    return null;
  }
  return {
    items: [
      ...repo.activityIssues.nodes.map((item) => toActivityItem("issue", item)),
      ...repo.activityPullRequests.nodes.map((item) => toActivityItem("pull", item)),
    ],
    lastMergedPullRequestAt: repo.lastMergedPullRequest?.nodes[0]?.mergedAt ?? null,
    unassignedGoodFirstIssues: repo.beginnerIssues.nodes.filter(
      (issue) => issue.assignees?.totalCount === 0,
    ).length,
  };
}

function embeddedContributing(repo: GraphQLRepository): string | null {
  return (
    gitifyConfig.github.insights.contributingPaths
      .map((_, index) => repo[`contributing${index}`]?.text)
      .find((text): text is string => typeof text === "string" && text.trim() !== "") ?? null
  );
}

function repositoryGraphFrom(repo: GraphQLRepository): RepositoryGraph {
  const target = repo.defaultBranchRef?.target;
  return {
    repository: {
      ownerAvatarUrl: repo.owner.avatarUrl,
      homepageUrl: homepageUrl(repo.homepageUrl),
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
      issues: repo.recentIssues.nodes.map(toIssue),
      beginnerIssues: repo.beginnerIssues.nodes.map(toIssue),
      pullRequests: repo.recentPullRequests.nodes.map(toPullRequest),
    },
    contributing: embeddedContributing(repo),
    activity: activitySample(repo),
  };
}

export async function fetchRepositoryGraph(
  transport: GitHubTransport,
  request: { ownerName: string; repoName: string; token: string },
): Promise<RepositoryGraph> {
  const limits = gitifyConfig.github.insights;
  const repo = await transport.graphql(
    {
      document: REPOSITORY_GRAPH_QUERY,
      token: request.token,
      variables: {
        owner: request.ownerName,
        name: request.repoName,
        issues: limits.issuesLimit,
        pullRequests: limits.pullRequestsLimit,
        languages: limits.languagesLimit,
        activity: limits.activitySampleSize,
      },
    },
    "insights",
    (data) => {
      const found = data.repository as GraphQLRepository | null | undefined;
      return typeof found?.stargazerCount === "number" ? found : null;
    },
  );
  return repositoryGraphFrom(repo);
}
