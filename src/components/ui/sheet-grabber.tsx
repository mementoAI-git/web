import { useRef, type PointerEvent } from "react";

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.5;

/** Drag handle for dialogs shown as bottom sheets on phones. CSS hides it on larger screens. */
export function SheetGrabber({ onDismiss }: { onDismiss: () => void }) {
  const start = useRef<{ y: number; time: number } | null>(null);

  const move = (sheet: HTMLElement | null, distance: number) => {
    sheet?.style.setProperty("--sheet-drag", `${distance}px`);
  };

  const finish = (event: PointerEvent<HTMLDivElement>, canDismiss: boolean) => {
    if (!start.current) return;
    const sheet = event.currentTarget.parentElement;
    const distance = Math.max(0, event.clientY - start.current.y);
    const velocity = distance / Math.max(1, performance.now() - start.current.time);
    start.current = null;
    if (sheet) sheet.style.transition = "";
    if (canDismiss && (distance > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY)) {
      onDismiss();
    }
    // Stay where the drag ended while the sheet closes; return if the dialog refused to close.
    requestAnimationFrame(() => {
      if (sheet?.getAttribute("data-state") !== "closed") move(sheet, 0);
    });
  };

  return (
    <div
      aria-hidden
      className="sheet-grabber"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { y: event.clientY, time: performance.now() };
        const sheet = event.currentTarget.parentElement;
        if (sheet) sheet.style.transition = "none";
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        move(
          event.currentTarget.parentElement,
          Math.max(0, event.clientY - start.current.y),
        );
      }}
      onPointerUp={(event) => finish(event, true)}
      onPointerCancel={(event) => finish(event, false)}
    />
  );
}
