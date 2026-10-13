import type { RepositorySnapshot } from "#services/github/github_adapter";
import type { GitHubTransport } from "#services/github/github_transport";
import gitifyConfig from "#config/gitify";
import { summarizeContributorActivity } from "#services/github/contributor_activity";
import {
  fetchRepositoryCommunity,
  fetchSharedCommunityFile,
} from "#services/github/repository_community";
import { fetchRepositoryDetails } from "#services/github/repository_details";
import { fetchRepositoryGraph } from "#services/github/repository_graph";

export async function assembleRepositorySnapshot(
  transport: GitHubTransport,
  request: { ownerName: string; repoName: string; token: string },
  now: () => Date,
): Promise<RepositorySnapshot> {
  const base = `${gitifyConfig.github.repoBaseUrl}/${request.ownerName}/${request.repoName}`;
  const [details, graph, community] = await Promise.all([
    fetchRepositoryDetails(transport, base, request.token),
    fetchRepositoryGraph(transport, request),
    fetchRepositoryCommunity(transport, base, request.token),
  ]);
  const contributing =
    graph.contributing ??
    (await fetchSharedCommunityFile(transport, community.contributingFileUrl, request.token));
  const { activity } = graph;
  return {
    ...details,
    contributing,
    repository: graph.repository,
    insights: {
      ...graph.insights,
      weeklyCommits: community.weeklyCommits,
      health: community.health,
      contributorActivity: activity
        ? summarizeContributorActivity(
            activity.items,
            {
              lastMergedPullRequestAt: activity.lastMergedPullRequestAt,
              unassignedGoodFirstIssues: activity.unassignedGoodFirstIssues,
            },
            now(),
          )
        : null,
    },
  };
}
