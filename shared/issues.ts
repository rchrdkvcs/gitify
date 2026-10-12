import type { IssueKind, RepositoryLabel } from "./types/index.js";

/** Label families searched on GitHub, with the label text sent to the search and public names. */
export const issueKindCatalog = [
  { id: "good-first-issue", label: "good first issue", name: "Good first issue" },
  { id: "help-wanted", label: "help wanted", name: "Help wanted" },
  { id: "documentation", label: "documentation", name: "Documentation" },
] as const satisfies readonly { id: IssueKind; label: string; name: string }[];

export const issueKinds: IssueKind[] = issueKindCatalog.map((kind) => kind.id);

/**
 * A reader's level maps to the label family maintainers use for that audience.
 * Levels without a dedicated label family see every kind.
 */
export function issueKindForDifficulty(difficulty: string): IssueKind | "all" {
  if (difficulty === "beginner") {
    return "good-first-issue";
  }
  if (difficulty === "expert") {
    return "help-wanted";
  }
  return "all";
}

export function issueKindLabel(kind: IssueKind): string {
  return issueKindCatalog.find((entry) => entry.id === kind)!.label;
}

// Maintainers spell these labels in many ways: "good first issue", "Good-First-Issue", "good first issue 👋"…
const goodFirstIssue = /good[\s_-]*first[\s_-]*issue/i;
const helpWanted = /help[\s_-]*wanted/i;

/** Labels already rendered as contribution signals. */
export function isSignalLabel(name: string): boolean {
  return goodFirstIssue.test(name) || helpWanted.test(name);
}

/** Contribution signals read from the labels actually set on the issue. */
export function issueSignals(labels: readonly Pick<RepositoryLabel, "name">[]) {
  return {
    isGoodFirstIssue: labels.some((label) => goodFirstIssue.test(label.name)),
    isHelpWanted: labels.some((label) => helpWanted.test(label.name)),
  };
}
