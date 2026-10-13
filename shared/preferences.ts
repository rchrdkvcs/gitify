import type { Difficulty } from "./types/common.js";
import type { ContributionType, ExperienceLevel, UserPreferences } from "./types/user.js";

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

export function normalizePreferenceLanguages(languages: readonly string[]): PreferenceLanguage[] {
  const normalized = languages.map((language) => language.trim().toLowerCase());
  return [...new Set(normalized)].filter((language): language is PreferenceLanguage =>
    languageNames.has(language),
  );
}

export function difficultyForLevel(level: ExperienceLevel): Difficulty {
  return experienceLevelCatalog.find((item) => item.id === level)?.difficulty ?? "beginner";
}

export function levelForDifficulty(difficulty: unknown): ExperienceLevel {
  return difficulty === "expert" ? "experienced" : "first_contribution";
}
