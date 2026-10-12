import type { Difficulty } from "./common.js";

export type UserPreferences = {
  difficulty: Difficulty;
  languages: string[];
};
