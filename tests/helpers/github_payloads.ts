export function graphqlActivityItem(
  overrides: {
    createdAt?: string;
    state?: "OPEN" | "CLOSED" | "MERGED";
    authorAssociation?: string;
    bot?: boolean;
    mergedAt?: string | null;
    replies?: { createdAt: string; authorAssociation: string }[];
  } = {},
) {
  return {
    createdAt: overrides.createdAt ?? "2026-09-01T00:00:00Z",
    state: overrides.state ?? "OPEN",
    authorAssociation: overrides.authorAssociation ?? "NONE",
    author: { __typename: overrides.bot ? "Bot" : "User" },
    comments: { nodes: overrides.replies ?? [] },
    mergedAt: overrides.mergedAt ?? null,
    reviews: { nodes: [] },
  };
}

const emptyConnection = { totalCount: 0 };

export function graphqlRepository() {
  return {
    data: {
      repository: {
        createdAt: "2020-01-01T00:00:00Z",
        pushedAt: null,
        homepageUrl: null as string | null,
        isArchived: false,
        diskUsage: 1,
        stargazerCount: 0,
        forkCount: 0,
        owner: { avatarUrl: "https://avatars.githubusercontent.com/u/1" },
        licenseInfo: null as { spdxId: string | null; name: string } | null,
        watchers: emptyConnection,
        openIssues: emptyConnection,
        closedIssues: emptyConnection,
        openPullRequests: emptyConnection,
        mergedPullRequests: emptyConnection,
        goodFirstIssues: emptyConnection,
        helpWantedIssues: emptyConnection,
        releases: emptyConnection,
        latestRelease: null,
        languages: { edges: [] },
        defaultBranchRef: null,
        recentIssues: { nodes: [] },
        beginnerIssues: { nodes: [] },
        recentPullRequests: { nodes: [] },
        activityIssues: { nodes: [] as ReturnType<typeof graphqlActivityItem>[] },
        activityPullRequests: { nodes: [] as ReturnType<typeof graphqlActivityItem>[] },
        lastMergedPullRequest: { nodes: [] as { mergedAt: string | null }[] },
      },
    },
  };
}

export function restDetailsTransport(overrides: Record<string, () => Response> = {}): typeof fetch {
  return async (input) => {
    const url = String(input);
    const override = Object.entries(overrides).find(([suffix]) => url.endsWith(suffix));
    if (override) {
      return override[1]();
    }
    if (url.endsWith("/graphql")) {
      return Response.json(graphqlRepository());
    }
    if (url.endsWith("/readme")) {
      return Response.json({
        content: Buffer.from("# Fresh").toString("base64"),
        encoding: "base64",
      });
    }
    if (url.endsWith("/languages")) {
      return Response.json({ TypeScript: 100 });
    }
    if (url.endsWith("/releases/latest")) {
      return Response.json({ tag_name: "v2" });
    }
    if (url.endsWith("/community/profile")) {
      return new Response(null, { status: 404 });
    }
    if (url.endsWith("/stats/commit_activity")) {
      return new Response(null, { status: 202 });
    }
    return Response.json([]);
  };
}
