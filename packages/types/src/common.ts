export type Difficulty = "beginner" | "expert";
export type InteractionType = "liked" | "passed";

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}
