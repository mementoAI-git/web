import { useCallback, useRef, useState, type PointerEvent } from "react";
import { useMotionValue } from "motion/react";
import type { ObservationItem } from "./observation-list";

const CURSOR_OFFSET = 18;
const SCREEN_MARGIN = 16;
/** Long enough to cross the gap between two cards without the popup closing. */
const HIDE_DELAY_MS = 120;
/** Tracks which observation the cursor is on, and where the popup should sit. */
export function useSourcesPreview() {
  const [item, setItem] = useState<ObservationItem | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const popup = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const show = useCallback(
    (next: ObservationItem, event: PointerEvent) => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      const width = popup.current?.offsetWidth ?? 360;
      const height = popup.current?.offsetHeight ?? 120;
      const below = event.clientY + CURSOR_OFFSET;
      x.set(
        Math.max(
          SCREEN_MARGIN,
          Math.min(
            event.clientX + CURSOR_OFFSET,
            window.innerWidth - width - SCREEN_MARGIN,
          ),
        ),
      );
      y.set(
        below + height > window.innerHeight - SCREEN_MARGIN
          ? event.clientY - CURSOR_OFFSET - height
          : below,
      );
      setItem(next);
    },
    [x, y],
  );

  const hide = useCallback(() => {
    if (hideTimer.current !== null) return;
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setItem(null);
    }, HIDE_DELAY_MS);
  }, []);

  return { item, x, y, popup, show, hide };
}
