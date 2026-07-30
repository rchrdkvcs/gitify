export type Difficulty = "beginner" | "expert";
export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}
