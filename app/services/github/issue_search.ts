import type { GitHubIssue, GitHubRepository } from "#services/github/github_adapter";
import type { GitHubTransport } from "#services/github/github_transport";
import type { IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { ISSUE_SEARCH_QUERY, issueSearchQuery } from "#services/github/github_queries";
import { type LicenseInfo, homepageUrl, licenseName } from "#services/github/repository_fields";

type GraphQLIssueRepository = {
  databaseId: number;
  name: string;
  url: string;
  description: string | null;
  homepageUrl: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  isArchived: boolean;
  isPrivate: boolean;
  hasIssuesEnabled?: boolean;
  stargazerCount: number;
  forkCount: number;
  owner: { login: string; avatarUrl: string | null };
  primaryLanguage: { name: string } | null;
  licenseInfo: LicenseInfo;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  issues: { totalCount: number };
  pullRequests: { totalCount: number };
};

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
  repository: GraphQLIssueRepository;
};

function repositoryFromGraph(repo: GraphQLIssueRepository): GitHubRepository {
  return {
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
    homepageUrl: homepageUrl(repo.homepageUrl),
    license: licenseName(repo.licenseInfo),
    pushedAt: repo.pushedAt,
    createdAt: repo.createdAt,
    isArchived: repo.isArchived,
    isPrivate: repo.isPrivate,
    hasIssues: repo.hasIssuesEnabled ?? true,
  };
}

function isIssue(node: unknown): node is GraphQLSearchIssue & { databaseId: number } {
  const candidate = node as Partial<GraphQLSearchIssue> | null;
  return typeof candidate?.databaseId === "number" && !!candidate.repository;
}

function issueFromGraph(issue: GraphQLSearchIssue & { databaseId: number }): GitHubIssue {
  return {
    id: issue.databaseId,
    number: issue.number,
    title: issue.title,
    url: issue.url,
    createdAt: issue.createdAt,
    comments: issue.comments.totalCount,
    assignees: issue.assignees.totalCount,
    linkedPullRequests: issue.closedByPullRequestsReferences?.totalCount ?? 0,
    labels: issue.labels.nodes.map((label) => ({ name: label.name, color: label.color })),
    repository: repositoryFromGraph(issue.repository),
  };
}

export async function searchIssues(
  transport: GitHubTransport,
  request: { language: string; kind: IssueKind; token: string; perPage: number },
): Promise<GitHubIssue[]> {
  const nodes = await transport.graphql(
    {
      document: ISSUE_SEARCH_QUERY,
      token: request.token,
      variables: {
        query: issueSearchQuery(request.language, request.kind),
        first: request.perPage,
        labels: gitifyConfig.github.issues.labelsLimit,
        topics: gitifyConfig.github.issues.topicsLimit,
      },
    },
    "issues",
    (data) => {
      const found = (data.search as { nodes?: unknown } | null)?.nodes;
      return Array.isArray(found) ? (found as unknown[]) : null;
    },
  );
  return nodes.filter(isIssue).map(issueFromGraph);
}
