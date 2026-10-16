import { useCallback, useState } from "react";

function visible(element: HTMLElement) {
  if (!element.isConnected) return false;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (
      node.hasAttribute("hidden") ||
      node.hasAttribute("inert") ||
      getComputedStyle(node).display === "none"
    )
      return false;
  }
  return true;
}

/** Separately mounted dialogs have no Radix Trigger to restore focus to. */
export function useDialogFocus() {
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  return useCallback(
    (event: Event) => {
      event.preventDefault();
      if (opener && opener !== document.body && visible(opener)) {
        opener.focus();
        return;
      }
      // A shared-memory handoff can unmount its opener when switching to Talk.
      const next =
        document.querySelector<HTMLElement>(
          '.people-tabs [role="tab"][aria-selected="true"]',
        ) ||
        document.querySelector<HTMLElement>(
          'input[aria-label="Search people"]',
        );
      if (next && visible(next)) next.focus();
    },
    [opener],
  );
}
