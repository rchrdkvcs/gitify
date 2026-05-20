import type { Difficulty } from "./common.js";

export interface UserPreferences {
  difficulty: Difficulty;
  languages: string[];
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  preferences: UserPreferences | null;
}
