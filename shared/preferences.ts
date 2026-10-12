import type { Difficulty } from "./types/common.js";
import type { ContributionType, ExperienceLevel, UserPreferences } from "./types/user.js";

/**
 * Identifiers used for storage and GitHub searches (`language:<id>`), their public labels and
 * Iconify icons. This list is the single source of truth for supported languages.
 */
export const languageCatalog = [
  { id: "javascript", name: "JavaScript", label: "JS", icon: "devicon-plain:javascript" },
  { id: "typescript", name: "TypeScript", label: "TS", icon: "devicon-plain:typescript" },
  { id: "python", name: "Python", label: "PY", icon: "devicon-plain:python" },
  { id: "java", name: "Java", label: "JA", icon: "devicon-plain:java" },
  { id: "c", name: "C", label: "C", icon: "devicon-plain:c" },
  { id: "c++", name: "C++", label: "C++", icon: "devicon-plain:cplusplus" },
  { id: "c#", name: "C#", label: "C#", icon: "devicon-plain:csharp" },
  { id: "go", name: "Go", label: "GO", icon: "devicon-plain:go" },
  { id: "rust", name: "Rust", label: "RS", icon: "devicon-plain:rust" },
  { id: "php", name: "PHP", label: "PHP", icon: "devicon-plain:php" },
  { id: "ruby", name: "Ruby", label: "RB", icon: "devicon-plain:ruby" },
  { id: "swift", name: "Swift", label: "SW", icon: "devicon-plain:swift" },
  { id: "kotlin", name: "Kotlin", label: "KT", icon: "devicon-plain:kotlin" },
  { id: "dart", name: "Dart", label: "DT", icon: "devicon-plain:dart" },
  { id: "objective-c", name: "Objective-C", label: "OBJC", icon: "devicon-plain:objectivec" },
  { id: "scala", name: "Scala", label: "SC", icon: "devicon-plain:scala" },
  { id: "elixir", name: "Elixir", label: "EX", icon: "devicon-plain:elixir" },
  { id: "erlang", name: "Erlang", label: "ERL", icon: "devicon-plain:erlang" },
  { id: "haskell", name: "Haskell", label: "HS", icon: "devicon-plain:haskell" },
  { id: "ocaml", name: "OCaml", label: "ML", icon: "devicon-plain:ocaml" },
  { id: "clojure", name: "Clojure", label: "CLJ", icon: "simple-icons:clojure" },
  { id: "zig", name: "Zig", label: "ZIG", icon: "simple-icons:zig" },
  { id: "lua", name: "Lua", label: "LUA", icon: "devicon-plain:lua" },
  { id: "shell", name: "Shell", label: "SH", icon: "devicon-plain:bash" },
  { id: "perl", name: "Perl", label: "PL", icon: "devicon-plain:perl" },
  { id: "r", name: "R", label: "R", icon: "devicon-plain:r" },
  { id: "julia", name: "Julia", label: "JL", icon: "devicon-plain:julia" },
  { id: "nix", name: "Nix", label: "NIX", icon: "devicon-plain:nixos" },
  { id: "html", name: "HTML", label: "HTML", icon: "devicon-plain:html5" },
  { id: "css", name: "CSS", label: "CSS", icon: "devicon-plain:css3" },
  { id: "vue", name: "Vue", label: "VUE", icon: "devicon-plain:vuejs" },
  { id: "svelte", name: "Svelte", label: "SV", icon: "devicon-plain:svelte" },
] as const;

export type PreferenceLanguage = (typeof languageCatalog)[number]["id"];

export const supportedPreferenceLanguages = languageCatalog.map((language) => language.id);
export const maxPreferenceLanguages = languageCatalog.length;

/** How far the user is in their open source journey; replaces the binary difficulty. */
export const experienceLevelCatalog = [
  {
    id: "first_contribution",
    title: "Ma toute première contribution",
    description:
      "Je n’ai encore jamais ouvert de pull request sur un projet open source. Je veux un cadre rassurant et des issues bien balisées.",
    icon: "lucide:sprout",
    difficulty: "beginner",
  },
  {
    id: "some_contributions",
    title: "Quelques contributions",
    description:
      "J’ai déjà fait une ou plusieurs PR. Je cherche des projets accueillants pour gagner en assurance.",
    icon: "lucide:git-pull-request",
    difficulty: "beginner",
  },
  {
    id: "experienced",
    title: "Contributeur aguerri",
    description:
      "Je suis à l’aise sur des bases de code existantes. Je cherche des projets populaires qui ont besoin d’aide (help wanted).",
    icon: "lucide:layers",
    difficulty: "expert",
  },
] as const satisfies readonly {
  id: ExperienceLevel;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
}[];

export const experienceLevels = experienceLevelCatalog.map((level) => level.id);

/**
 * Ways to help a project. `issueLabels` are the GitHub labels that usually mark matching
 * issues, so issue-based features can filter on them.
 */
export const contributionTypeCatalog = [
  {
    id: "code",
    title: "Code",
    description: "Corriger des bugs, ajouter des fonctionnalités.",
    icon: "lucide:code",
    issueLabels: ["bug", "enhancement", "feature"],
  },
  {
    id: "documentation",
    title: "Documentation",
    description: "Clarifier un README, écrire un guide, corriger une coquille.",
    icon: "lucide:book-open",
    issueLabels: ["documentation", "docs"],
  },
  {
    id: "tests",
    title: "Tests",
    description: "Écrire des tests, reproduire et isoler des bugs.",
    icon: "lucide:flask-conical",
    issueLabels: ["tests", "testing", "test"],
  },
  {
    id: "translation",
    title: "Traduction",
    description: "Traduire une interface ou une documentation.",
    icon: "lucide:languages",
    issueLabels: ["translation", "i18n", "l10n", "localization"],
  },
  {
    id: "design",
    title: "Design",
    description: "Améliorer l’interface, l’accessibilité ou l’identité visuelle.",
    icon: "lucide:pen-tool",
    issueLabels: ["design", "ui", "ux", "accessibility", "a11y"],
  },
  {
    id: "triage",
    title: "Triage",
    description: "Reproduire des issues, les étiqueter, aider d’autres utilisateurs.",
    icon: "lucide:list-checks",
    issueLabels: ["triage", "needs triage", "needs reproduction", "question"],
  },
] as const satisfies readonly {
  id: ContributionType;
  title: string;
  description: string;
  icon: string;
  issueLabels: readonly string[];
}[];

export const contributionTypes = contributionTypeCatalog.map((type) => type.id);

/** Common GitHub topics proposed during onboarding. Any valid topic slug is accepted. */
export const topicSuggestions = [
  "web",
  "cli",
  "devtools",
  "api",
  "mobile",
  "game",
  "machine-learning",
  "data-visualization",
  "security",
  "accessibility",
  "education",
  "documentation",
  "self-hosted",
  "open-data",
  "embedded",
  "hacktoberfest",
] as const;

export const maxPreferenceTopics = 10;
export const topicPattern = /^[a-z0-9][a-z0-9-]{0,49}$/;

/** Preferences of someone who has not answered anything yet: no filter applied. */
export const defaultUserPreferences: UserPreferences = {
  level: "first_contribution",
  languages: [],
  contributionTypes: [],
  topics: [],
};

const languageNames = new Map<string, string>(
  languageCatalog.map((language) => [language.id, language.name]),
);

export function formatLanguageName(language: string): string {
  return languageNames.get(language.trim().toLowerCase()) ?? language;
}

/** Handles legacy stored preferences too: discard unsupported entries and preserve first-choice order. */
export function normalizePreferenceLanguages(languages: readonly string[]): PreferenceLanguage[] {
  const normalized = languages.map((language) => language.trim().toLowerCase());
  return [...new Set(normalized)].filter((language): language is PreferenceLanguage =>
    languageNames.has(language),
  );
}

/** GitHub search level used by the catalogue for an experience level. */
export function difficultyForLevel(level: ExperienceLevel): Difficulty {
  return experienceLevelCatalog.find((item) => item.id === level)?.difficulty ?? "beginner";
}

/** Legacy binary difficulty mapped onto the new levels (used by the data migration too). */
export function levelForDifficulty(difficulty: unknown): ExperienceLevel {
  return difficulty === "expert" ? "experienced" : "first_contribution";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Reads stored preferences of any shape: the current one, the legacy
 * `{ difficulty, languages }` one, or partial drafts. Unknown entries are dropped and
 * missing ones fall back to "no preference". Returns null when nothing was ever saved.
 */
export function normalizeUserPreferences(raw: unknown): UserPreferences | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const value = raw as Record<string, unknown>;
  const level = experienceLevels.includes(value.level as ExperienceLevel)
    ? (value.level as ExperienceLevel)
    : levelForDifficulty(value.difficulty);
  // Legacy accounts chose programming languages: they came for code contributions.
  const legacy = !("level" in value) && "difficulty" in value;
  const types = stringList(value.contributionTypes).filter((type): type is ContributionType =>
    contributionTypes.includes(type as ContributionType),
  );

  return {
    level,
    languages: normalizePreferenceLanguages(stringList(value.languages)),
    contributionTypes: legacy && types.length === 0 ? ["code"] : [...new Set(types)],
    topics: [
      ...new Set(
        stringList(value.topics)
          .map((topic) => topic.trim().toLowerCase())
          .filter((topic) => topicPattern.test(topic)),
      ),
    ].slice(0, maxPreferenceTopics),
  };
}

// GitHub reports some languages under names that differ from the catalogue identifier.
const githubLanguageAliases: Record<string, PreferenceLanguage> = {
  "jupyter notebook": "python",
  scss: "css",
  "vim script": "shell",
  powershell: "shell",
};

/**
 * Most used catalogue languages among a user's repositories, most frequent first.
 * Ties keep the order of first appearance, so callers should pass recently pushed
 * repositories first.
 */
export function inferPreferredLanguages(
  repositoryLanguages: readonly (string | null)[],
  limit = 4,
): PreferenceLanguage[] {
  const counts = new Map<PreferenceLanguage, number>();
  for (const name of repositoryLanguages) {
    if (!name) {
      continue;
    }
    const lower = name.trim().toLowerCase();
    const id = githubLanguageAliases[lower] ?? normalizePreferenceLanguages([lower])[0];
    if (id) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
