import type { SubscriptionUsage } from "./types";

export const FREE_LIMIT_BYTES = 200 * 1024 ** 2;
export const PRO_LIMIT_BYTES = 10 * 1024 ** 3;

export function formatBytes(n: number) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Retain legacy usage when billing omits it, but never trust its old quota. */
export function formatStorageSummary(
  usage: SubscriptionUsage | undefined,
  isProOrAbove: boolean,
  legacyStorage?: string,
) {
  let used = usage?.storage_used_bytes;
  if (used == null && legacyStorage) {
    const match = legacyStorage.match(
      /^\s*([\d.]+)\s*(B|KB|MB|GB)?\s*\/\s*[\d.]+\s*(B|KB|MB|GB)\s*$/i,
    );
    if (match) {
      const unit = (match[2] || match[3]).toUpperCase();
      const exponent = ["B", "KB", "MB", "GB"].indexOf(unit);
      const value = Number(match[1]);
      if (Number.isFinite(value)) used = value * 1024 ** exponent;
    }
  }
  const limit =
    usage?.storage_limit_bytes ??
    (isProOrAbove ? PRO_LIMIT_BYTES : FREE_LIMIT_BYTES);
  return `${used == null ? "—" : formatBytes(used)} / ${formatBytes(limit)}`;
}
