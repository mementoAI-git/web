/** Minimum width kept for the main chat column before shrinking the docked sidebar. */
const SIDEBAR_DESKTOP_MAIN_RESERVE_PX = 420;
const SIDEBAR_CHAT_MAX_PX = 485 * 0.95;
const SIDEBAR_CHAT_MIN_PX = 280;
const SIDEBAR_MEMORY_MAX_PX = 316;
const SIDEBAR_MEMORY_MIN_PX = 260;

/**
 * Pixel width for the desktop memory sidebar (`md+`), based on viewport so the
 * conversation column is not squeezed off-screen on smaller laptop widths.
 */
export function resolveSidebarDesktopWidthPx(
  viewportWidth: number,
  opts: { wideChatPanel: boolean },
): number {
  if (!Number.isFinite(viewportWidth)) {
    return opts.wideChatPanel ? SIDEBAR_CHAT_MAX_PX : SIDEBAR_MEMORY_MAX_PX;
  }
  const budget = viewportWidth - SIDEBAR_DESKTOP_MAIN_RESERVE_PX;
  if (opts.wideChatPanel) {
    return Math.min(
      SIDEBAR_CHAT_MAX_PX,
      Math.max(SIDEBAR_CHAT_MIN_PX, budget),
    );
  }
  return Math.min(
    SIDEBAR_MEMORY_MAX_PX,
    Math.max(SIDEBAR_MEMORY_MIN_PX, budget),
  );
}
