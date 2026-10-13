import type { GitHubTransport } from "#services/github/github_transport";
import type { CommunityFiles, RepositoryInsights } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { decodeBase64File } from "#services/github/repository_details";

export type RepositoryCommunity = {
  health: RepositoryInsights["health"];
  weeklyCommits: number[] | null;
  contributingFileUrl: string | null;
};

type CommunityProfile = { health_percentage?: unknown; files?: Record<string, unknown> };

const SHARED_FILE_URL = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

function healthFrom(profile: CommunityProfile | null): RepositoryInsights["health"] {
  if (!profile || typeof profile.health_percentage !== "number") {
    return null;
  }
  const files = profile.files ?? {};
  return {
    percentage: profile.health_percentage,
    files: {
      readme: !!files.readme,
      contributing: !!files.contributing,
      codeOfConduct: !!files.code_of_conduct,
      license: !!files.license,
      issueTemplate: !!files.issue_template,
      pullRequestTemplate: !!files.pull_request_template,
    } satisfies CommunityFiles,
  };
}

function weeklyCommitsFrom(activity: unknown): number[] | null {
  return Array.isArray(activity)
    ? activity.map((week: { total?: unknown }) =>
        typeof week?.total === "number" ? week.total : 0,
      )
    : null;
}

export async function fetchRepositoryCommunity(
  transport: GitHubTransport,
  base: string,
  token: string,
): Promise<RepositoryCommunity> {
  const [profileReply, activityReply] = await Promise.all([
    transport.send(`${base}/community/profile`, { token, outcomes: { 404: "absent" } }),
    transport.send(`${base}/stats/commit_activity`, {
      token,
      outcomes: { 202: "pending", 204: "empty" },
    }),
  ]);
  const profile = profileReply.kind === "data" ? (profileReply.data as CommunityProfile) : null;
  const contributingUrl = (profile?.files?.contributing as { html_url?: unknown } | null)?.html_url;
  return {
    health: healthFrom(profile),
    weeklyCommits:
      activityReply.kind === "empty"
        ? []
        : activityReply.kind === "data"
          ? weeklyCommitsFrom(activityReply.data)
          : null,
    contributingFileUrl: typeof contributingUrl === "string" ? contributingUrl : null,
  };
}

export async function fetchSharedCommunityFile(
  transport: GitHubTransport,
  htmlUrl: string | null,
  token: string,
): Promise<string | null> {
  const match = htmlUrl ? SHARED_FILE_URL.exec(htmlUrl) : null;
  if (!match) {
    return null;
  }
  const [, owner, repo, ref, path] = match;
  const reply = await transport.send(
    `${gitifyConfig.github.repoBaseUrl}/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    { token, outcomes: { 404: "absent" } },
  );
  return reply.kind === "data" ? decodeBase64File(reply.data) : null;
}
