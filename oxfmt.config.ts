import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: {
    newlinesBetween: false,
    groups: [
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
  sortTailwindcss: {
    stylesheet: "./inertia/assets/styles/main.css",
    preserveWhitespace: true,
  },
  sortPackageJson: {
    sortScripts: true,
  },
  ignorePatterns: [
    "CHANGELOG.md",
    ".adonisjs/**",
    "public/assets/**",
    "build/**",
    "inertia/auto-imports.d.ts",
    "inertia/components.d.ts",
  ],
});
