import { createContext, useContext } from "react";

/**
 * True while a modal that was just closed stays mounted to play its close
 * animation. Modals with an exit animation read it and close their dialog.
 */
export const ModalClosingContext = createContext(false);

export const useModalClosing = () => useContext(ModalClosingContext);

/** Modals the stack keeps mounted after close so they can animate out. */
export const EXIT_ANIMATED_MODALS = ["view-memory"];

/** The close duration from the motion tokens in index.css. */
export function modalCloseMs() {
  if (typeof window === "undefined") return 150;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur");
  return parseFloat(value) || 150;
}
