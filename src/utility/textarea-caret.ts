/**
 * Returns the viewport coordinates of the caret at the given offset in a textarea,
 * so a popup can be positioned consistently with rich-text editors (e.g. TipTap coordsAtPos).
 * Uses a mirror div positioned over the textarea so getClientRects() returns correct viewport coords.
 */
export function getTextareaCaretCoordinates(
  textarea: HTMLTextAreaElement,
  offset: number,
): { top: number; left: number } | null {
  if (offset < 0 || offset > textarea.value.length) return null;

  const rect = textarea.getBoundingClientRect();
  const style = getComputedStyle(textarea);
  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");

  const s: Record<string, string> = {
    position: "fixed",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    font: style.font,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontVariant: style.fontVariant,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    padding: style.padding,
    border: style.border,
    boxSizing: style.boxSizing,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflow: "hidden",
    visibility: "hidden",
    pointerEvents: "none",
  };
  Object.assign(mirror.style, s);

  const value = textarea.value.substring(0, offset);
  mirror.textContent = value || "\u200b";

  document.body.appendChild(mirror);

  const rects = mirror.getClientRects();
  const last = rects.length > 0 ? rects[rects.length - 1] : null;
  document.body.removeChild(mirror);

  if (!last) return null;

  return {
    top: last.top,
    left: last.left,
  };
}
