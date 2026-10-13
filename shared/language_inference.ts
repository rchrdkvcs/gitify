import { normalizePreferenceLanguages, type PreferenceLanguage } from "./preferences.js";

const githubLanguageAliases: Record<string, PreferenceLanguage> = {
  "jupyter notebook": "python",
  scss: "css",
  "vim script": "shell",
  powershell: "shell",
};

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
