import type { Difficulty } from "./types/common.js";

/** Identifiers used for storage and GitHub searches, their public labels and Iconify icons. */
export const languageCatalog = [
  { id: "javascript", name: "JavaScript", label: "JS", icon: "devicon-plain:javascript" },
  { id: "typescript", name: "TypeScript", label: "TS", icon: "devicon-plain:typescript" },
  { id: "python", name: "Python", label: "PY", icon: "devicon-plain:python" },
  { id: "java", name: "Java", label: "JA", icon: "devicon-plain:java" },
  { id: "c++", name: "C++", label: "C++", icon: "devicon-plain:cplusplus" },
  { id: "c#", name: "C#", label: "C#", icon: "devicon-plain:csharp" },
  { id: "ruby", name: "Ruby", label: "RB", icon: "devicon-plain:ruby" },
  { id: "go", name: "Go", label: "GO", icon: "devicon-plain:go" },
  { id: "rust", name: "Rust", label: "RS", icon: "devicon-plain:rust" },
  { id: "php", name: "PHP", label: "PHP", icon: "devicon-plain:php" },
  { id: "swift", name: "Swift", label: "SW", icon: "devicon-plain:swift" },
  { id: "kotlin", name: "Kotlin", label: "KT", icon: "devicon-plain:kotlin" },
  { id: "dart", name: "Dart", label: "DT", icon: "devicon-plain:dart" },
] as const;

export type PreferenceLanguage = (typeof languageCatalog)[number]["id"];
export type NormalizedUserPreferences = {
  difficulty: Difficulty;
  languages: PreferenceLanguage[];
};

export const supportedPreferenceLanguages = languageCatalog.map((language) => language.id);
export const maxPreferenceLanguages = languageCatalog.length;

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
