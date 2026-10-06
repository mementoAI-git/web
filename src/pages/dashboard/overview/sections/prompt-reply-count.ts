import type { DashboardPromptSlot } from "@/utility/interface";

function realReplyCount(row: DashboardPromptSlot): number | null {
  const count = row.reply_user_count;
  return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
    ? count
    : null;
}

function promptIdentity(row: DashboardPromptSlot): string {
  return row.slot_kind === "static"
    ? `static:${row.prompt._id ?? row.prompt.title}`
    : `ai:${row.ai_prompt_text}`;
}

/** Apply the requested display floor; counts above 30 always remain exact. */
export function getPromptReplyCounts(rows: DashboardPromptSlot[]): number[] {
  const usedCounts = new Set(
    rows
      .map(realReplyCount)
      .filter((count): count is number => count !== null && count > 30),
  );
  const counts = new Map<DashboardPromptSlot, number>();
  // Stable prompt order keeps the display floors consistent when cards shuffle.
  const sortedRows = [...rows].sort((a, b) =>
    promptIdentity(a).localeCompare(promptIdentity(b)),
  );
  for (const row of sortedRows) {
    const real = realReplyCount(row);
    if (real !== null && real > 30) {
      counts.set(row, real);
      continue;
    }
    let hash = 0;
    for (const character of promptIdentity(row)) {
      hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
    }
    let displayed = 30 + (hash % 10);
    while (usedCounts.has(displayed)) displayed++;
    usedCounts.add(displayed);
    counts.set(row, displayed);
  }
  return rows.map((row) => counts.get(row)!);
}
