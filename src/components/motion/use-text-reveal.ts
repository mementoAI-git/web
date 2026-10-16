import { useLayoutEffect, type RefObject } from "react";

/** Replay the recipe without remounting interactive children or moving focus. */
export function useTextReveal(
  ref: RefObject<HTMLElement | null>,
  revision = "",
) {
  useLayoutEffect(() => {
    const block = ref.current;
    if (!block) return;
    block.classList.remove("is-shown", "is-hiding");
    void block.offsetHeight;
    block.classList.add("is-shown");
  }, [ref, revision]);
}
