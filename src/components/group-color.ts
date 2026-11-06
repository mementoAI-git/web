const LAST_GROUP_COLOR = 6;

/** Stored color indexes offered by the picker, in display order. */
export const GROUP_COLOR_PICKER = [0, 1, 3, 2, 6, 4] as const;

export function groupColorVar(color?: number | null) {
  const index = Math.min(Math.max(color ?? 0, 0), LAST_GROUP_COLOR);
  return `var(--group-color-${index})`;
}
