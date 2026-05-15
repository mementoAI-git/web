import type { CategoryScore } from "./enrichment-api.types";

/** Pick the richest dimension label for “where your story leads” copy. */
export function deriveTopCategoryLabel(scores: CategoryScore[] | undefined): string | null {
  if (!scores?.length) return null;
  const withItems = scores.filter((c) => c.unlocked && c.itemCount > 0);
  const pool = withItems.length ? withItems : scores.filter((c) => c.unlocked);
  if (!pool.length) return null;
  const sorted = [...pool].sort((a, b) => {
    if (b.itemCount !== a.itemCount) return b.itemCount - a.itemCount;
    return b.score - a.score;
  });
  return sorted[0]?.label ?? null;
}
