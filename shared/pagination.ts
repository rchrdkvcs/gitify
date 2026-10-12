/** Canonical page input for both HTML and JSON pagination. */
export function normalizePage(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") return 1;
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), Number.MAX_SAFE_INTEGER);
}
