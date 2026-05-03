"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type RootRef = RefObject<HTMLElement | null>;

export interface UseDismissOnOutsidePressOptions {
  active: boolean;
  onDismiss: () => void;
  /** Refs whose subtree counts as “inside” (presses elsewhere call onDismiss). */
  rootRefs: RootRef[];
}

/**
 * Dismiss floating UI on outside press. Uses capture-phase listeners so this still runs
 * when nested handlers call stopPropagation on the bubble phase (common in modals).
 */
export function useDismissOnOutsidePress({
  active,
  onDismiss,
  rootRefs,
}: UseDismissOnOutsidePressOptions) {
  const onDismissRef = useRef(onDismiss);
  const rootsRef = useRef(rootRefs);
  onDismissRef.current = onDismiss;
  rootsRef.current = rootRefs;

  useEffect(() => {
    if (!active) return;

    const onDoc = (event: MouseEvent | TouchEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const inside = rootsRef.current.some((r) => r.current?.contains(target));
      if (!inside) onDismissRef.current();
    };

    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("touchstart", onDoc, true);
    document.addEventListener("pointerdown", onDoc, true);
    return () => {
      document.removeEventListener("mousedown", onDoc, true);
      document.removeEventListener("touchstart", onDoc, true);
      document.removeEventListener("pointerdown", onDoc, true);
    };
  }, [active]);
}
