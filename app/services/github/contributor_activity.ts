import type { ContributorActivity } from "#shared/types/index";

export type ActivitySampleItem = {
  kind: "issue" | "pull";
  createdAt: string;
  authorAssociation: string;
  automated: boolean;
  state: "OPEN" | "CLOSED" | "MERGED";
  mergedAt: string | null;
  replies: { createdAt: string; authorAssociation: string }[];
};

const MAINTAINERS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const UNANSWERED_JUDGED_AFTER_HOURS = 72;
const MIN_JUDGED_ITEMS_FOR_RESPONSE_TIME = 3;

const hoursBetween = (from: number, to: number) => (to - from) / 3_600_000;

function median(values: number[]): number | null {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeContributorActivity(
  items: ActivitySampleItem[],
  extra: { lastMergedPullRequestAt: string | null; unassignedGoodFirstIssues: number },
  now: Date,
): ContributorActivity {
  const external = items.filter(
    (item) => !item.automated && !MAINTAINERS.has(item.authorAssociation),
  );
  const waits: number[] = [];
  let respondedItems = 0;

  for (const item of external) {
    const created = Date.parse(item.createdAt);
    if (!Number.isFinite(created)) {
      continue;
    }
    const answers = item.replies
      .filter((reply) => MAINTAINERS.has(reply.authorAssociation))
      .map((reply) => Date.parse(reply.createdAt));
    if (item.mergedAt) {
      answers.push(Date.parse(item.mergedAt));
    }
    const first = Math.min(...answers.filter((time) => Number.isFinite(time) && time >= created));
    if (Number.isFinite(first)) {
      respondedItems++;
      waits.push(hoursBetween(created, first));
      continue;
    }
    const age = hoursBetween(created, now.getTime());
    if (age >= UNANSWERED_JUDGED_AFTER_HOURS) {
      waits.push(age);
    }
  }

  const pulls = external.filter((item) => item.kind === "pull");
  const medianWait = waits.length >= MIN_JUDGED_ITEMS_FOR_RESPONSE_TIME ? median(waits) : null;
  return {
    sampledItems: waits.length,
    respondedItems,
    medianFirstResponseHours: medianWait === null ? null : Math.round(medianWait * 10) / 10,
    externalPullRequestsMerged: pulls.filter((item) => item.state === "MERGED").length,
    externalPullRequestsClosed: pulls.filter((item) => item.state === "CLOSED").length,
    lastMergedPullRequestAt: extra.lastMergedPullRequestAt,
    unassignedGoodFirstIssues: extra.unassignedGoodFirstIssues,
  };
}
