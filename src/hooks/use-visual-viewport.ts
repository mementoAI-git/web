import { useEffect, useState } from "react";

/**
 * The part of the screen the on-screen keyboard leaves visible. iOS Safari
 * doesn't shrink the layout for the keyboard, so anything pinned to the bottom
 * has to follow this to stay above it.
 */
export function useVisualViewport(): { height: number; top: number } | null {
  const [box, setBox] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setBox({ height: viewport.height, top: viewport.offsetTop });
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return box;
}
