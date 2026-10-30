import type { IMemory } from "@/utility/interface";

export type RecoveryDates = Pick<IMemory, "deleted_at" | "delete_after">;
const HOUR = 60 * 60 * 1000;

export function canRestoreMemory(memory: RecoveryDates, now = Date.now()): boolean {
  return !memory.delete_after || new Date(memory.delete_after).getTime() > now;
}

export function recoveryLabel(deadline?: string | null, now = Date.now()): string {
  const remaining = deadline ? new Date(deadline).getTime() - now : NaN;
  if (!Number.isFinite(remaining)) return "Recovery window unavailable";
  if (remaining <= 0) return "Pending permanent deletion";
  const days = Math.ceil(remaining / (24 * HOUR));
  if (remaining > 24 * HOUR) return `Permanently deletes in ${days} days`;
  const hours = Math.ceil(remaining / HOUR);
  if (remaining > HOUR) return `Permanently deletes in ${hours} hours`;
  const minutes = Math.max(1, Math.ceil(remaining / 60_000));
  return `Permanently deletes in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}
