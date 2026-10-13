import type {
  ContributionType,
  Difficulty,
  IssueKind,
  RepositoryLabel,
  UserPreferences,
} from "./types/index.js";
import { difficultyForLevel } from "./preferences.js";

export const issueKindCatalog = [
  {
    id: "good-first-issue",
    label: "good first issue",
    name: "Good first issue",
    contributionType: "code",
    difficulty: "beginner",
  },
  {
    id: "help-wanted",
    label: "help wanted",
    name: "Help wanted",
    contributionType: "code",
    difficulty: "expert",
  },
  {
    id: "documentation",
    label: "documentation",
    name: "Documentation",
    contributionType: "documentation",
    difficulty: null,
  },
] as const satisfies readonly {
  id: IssueKind;
  label: string;
  name: string;
  contributionType: ContributionType;
  difficulty: Difficulty | null;
}[];

export const issueKinds: IssueKind[] = issueKindCatalog.map((kind) => kind.id);

export function defaultIssueKind(
  preferences: Pick<UserPreferences, "level" | "contributionTypes">,
): IssueKind | "all" {
  const difficulty = difficultyForLevel(preferences.level);
  const suited = issueKindCatalog.filter(
    (kind) => kind.difficulty === null || kind.difficulty === difficulty,
  );
  const chosen = suited.find((kind) =>
    preferences.contributionTypes.includes(kind.contributionType),
  );
  const forCode = suited.find((kind) => kind.contributionType === "code");
  return (chosen ?? forCode)?.id ?? "all";
}

export function codeIssueKindFor(difficulty: Difficulty): IssueKind {
  return issueKindCatalog.find(
    (kind) => kind.contributionType === "code" && kind.difficulty === difficulty,
  )!.id;
}

export function issueKindLabel(kind: IssueKind): string {
  return issueKindCatalog.find((entry) => entry.id === kind)!.label;
}

const goodFirstIssue = /good[\s_-]*first[\s_-]*issue/i;
const helpWanted = /help[\s_-]*wanted/i;

export function isSignalLabel(name: string): boolean {
  return goodFirstIssue.test(name) || helpWanted.test(name);
}

export function issueSignals(labels: readonly Pick<RepositoryLabel, "name">[]) {
  return {
    isGoodFirstIssue: labels.some((label) => goodFirstIssue.test(label.name)),
    isHelpWanted: labels.some((label) => helpWanted.test(label.name)),
  };
}
