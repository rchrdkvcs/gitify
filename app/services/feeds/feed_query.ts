import type { PaginationMeta } from "#shared/types/index";

export type PageOf<T> = {
  all(): T[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
};

export function containsPattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function paginationMeta(page: PageOf<unknown>): PaginationMeta {
  return {
    total: page.total,
    perPage: page.perPage,
    currentPage: page.currentPage,
    lastPage: Math.max(1, page.lastPage),
  };
}
