import dayjs from "dayjs";
import type { IMessage } from "@/utility/interface";

/** `YYYY-MM` keys in first-seen order (chronological by message list order). */
export function monthKeysFromMessages(messages: Partial<IMessage>[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const m of messages) {
    if (!m.created_at) continue;
    const d = dayjs(m.created_at);
    if (!d.isValid()) continue;
    const k = d.format("YYYY-MM");
    if (!seen.has(k)) {
      seen.add(k);
      ordered.push(k);
    }
  }
  return ordered;
}

export function formatJumpMonthLabel(yyyyMm: string): string {
  const d = dayjs(`${yyyyMm}-01`);
  return d.isValid() ? d.format("MMM YYYY") : yyyyMm;
}

export function dayDividerLabel(iso: string): string {
  const d = dayjs(iso);
  if (!d.isValid()) return "";
  const today = dayjs().startOf("day");
  const y = d.startOf("day");
  if (y.isSame(today, "day")) return "Today";
  if (y.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
  return d.format("MMMM D, YYYY");
}
