import type { Difficulty } from "./types/common.js";

/** Identifiers used for storage and GitHub searches, and their public labels. */
export const languageCatalog = [
  { id: "javascript", name: "JavaScript", label: "JS" },
  { id: "typescript", name: "TypeScript", label: "TS" },
  { id: "python", name: "Python", label: "PY" },
  { id: "java", name: "Java", label: "JA" },
  { id: "c++", name: "C++", label: "C++" },
  { id: "c#", name: "C#", label: "C#" },
  { id: "ruby", name: "Ruby", label: "RB" },
  { id: "go", name: "Go", label: "GO" },
  { id: "rust", name: "Rust", label: "RS" },
  { id: "php", name: "PHP", label: "PHP" },
  { id: "swift", name: "Swift", label: "SW" },
  { id: "kotlin", name: "Kotlin", label: "KT" },
  { id: "dart", name: "Dart", label: "DT" },
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
