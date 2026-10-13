import type { GitHubContributor } from "#services/github/github_adapter";
import type { GitHubTransport } from "#services/github/github_transport";
import gitifyConfig from "#config/gitify";
import { GitHubInvalidResponseError } from "#services/github/github_errors";

export type RepositoryDetails = {
  readme: string | null;
  languages: Record<string, number>;
  contributors: GitHubContributor[];
  totalContributorsCount: number;
  latestRelease: string | null;
};

type RestContributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

export function decodeBase64File(data: unknown): string | null {
  const file = data as { content?: unknown; encoding?: unknown } | null;
  return typeof file?.content === "string" && file.encoding === "base64"
    ? Buffer.from(file.content, "base64").toString("utf-8")
    : null;
}

function isLanguageMap(data: unknown): data is Record<string, number> {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Object.values(data).every(
      (count) => typeof count === "number" && Number.isFinite(count) && count >= 0,
    )
  );
}

function isRestContributor(item: unknown): item is RestContributor {
  const c = item as Partial<RestContributor> | null;
  return (
    !!c &&
    Number.isInteger(c.id) &&
    typeof c.login === "string" &&
    typeof c.avatar_url === "string" &&
    typeof c.html_url === "string" &&
    typeof c.type === "string" &&
    Number.isInteger(c.contributions) &&
    c.contributions! >= 0
  );
}

function contributorFromRest(contributor: RestContributor): GitHubContributor {
  return {
    id: contributor.id,
    login: contributor.login,
    avatarUrl: contributor.avatar_url,
    profileUrl: contributor.html_url,
    contributions: contributor.contributions,
  };
}

function lastPage(headers: Headers): number | null {
  const link = headers.get("link");
  const match = link ? /[?&]page=(\d+)>; rel="last"/.exec(link) : null;
  return match ? Number.parseInt(match[1], 10) : null;
}

export async function fetchRepositoryDetails(
  transport: GitHubTransport,
  base: string,
  token: string,
): Promise<RepositoryDetails> {
  const [readmeReply, languages, contributorsReply, releaseReply, totalReply] = await Promise.all([
    transport.send(`${base}/readme`, { token, outcomes: { 404: "absent" } }),
    transport.data(`${base}/languages`, { token }),
    transport.send(
      `${base}/contributors?per_page=${gitifyConfig.github.contributors.topContributorsLimit}`,
      { token, outcomes: { 204: "empty" } },
    ),
    transport.send(`${base}/releases/latest`, { token, outcomes: { 404: "absent" } }),
    transport.send(`${base}/contributors?per_page=1&anon=false`, {
      token,
      outcomes: { 204: "empty" },
    }),
  ]);

  const readme = readmeReply.kind === "data" ? decodeBase64File(readmeReply.data) : null;
  if (readmeReply.kind === "data" && readme === null) {
    throw new GitHubInvalidResponseError("README");
  }
  if (!isLanguageMap(languages.data)) {
    throw new GitHubInvalidResponseError("languages");
  }
  const contributors = contributorsReply.kind === "data" ? contributorsReply.data : [];
  if (!Array.isArray(contributors) || !contributors.every(isRestContributor)) {
    throw new GitHubInvalidResponseError("contributors");
  }
  const release = releaseReply.kind === "data" ? releaseReply.data : null;
  const tagName = (release as { tag_name?: unknown } | null)?.tag_name;
  if (release !== null && typeof tagName !== "string") {
    throw new GitHubInvalidResponseError("release");
  }
  const total = totalReply.kind === "data" ? totalReply : null;
  if (total && !Array.isArray(total.data)) {
    throw new GitHubInvalidResponseError("contributor count");
  }

  return {
    readme,
    languages: languages.data,
    contributors: contributors
      .filter((contributor) => contributor.type === "User")
      .map(contributorFromRest),
    totalContributorsCount: total
      ? (lastPage(total.headers) ?? (total.data as unknown[]).length)
      : 0,
    latestRelease: typeof tagName === "string" ? tagName : null,
  };
}
