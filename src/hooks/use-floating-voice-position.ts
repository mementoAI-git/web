import { useEffect, useState, type RefObject } from "react";

type Position = { left: number; top: number };
export function clampVoicePosition(position: Position, width: number, height: number, viewportWidth: number, viewportHeight: number): Position {
  const maxTop = Math.max(8, viewportHeight - height - 8);
  const minTop = Math.min(84, maxTop); // Keep the drag handle below the fixed navbar.
  return {
    left: Math.min(Math.max(8, position.left), Math.max(8, viewportWidth - width - 8)),
    top: Math.min(Math.max(minTop, position.top), maxTop),
  };
}

/** Native events follow the stable portal host as it moves between dashboard surfaces. */
export function useFloatingVoicePosition(host: HTMLElement, container: RefObject<HTMLDivElement | null>, active: boolean) {
  const [position, setPosition] = useState<Position | null>(null);
  useEffect(() => {
    if (!active) return;
    let drag: { pointerId: number; x: number; y: number; left: number; top: number } | null = null;
    const move = (left: number, top: number) => {
      const rect = container.current?.getBoundingClientRect();
      if (rect) setPosition(clampVoicePosition({ left, top }, rect.width, rect.height, window.innerWidth, window.innerHeight));
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target as Element).closest('[data-voice-drag-handle]')) return;
      const rect = container.current?.getBoundingClientRect();
      if (!rect) return;
      event.preventDefault();
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
      (event.target as HTMLElement).closest<HTMLElement>('[data-voice-drag-handle]')?.focus();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      move(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
    };
    const up = () => { drag = null; };
    const keyboard = (event: KeyboardEvent) => {
      if (!(event.target as Element).closest('[data-voice-drag-handle]')) return;
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      const rect = container.current?.getBoundingClientRect();
      if (!delta || !rect) return;
      event.preventDefault();
      const distance = event.shiftKey ? 40 : 10;
      move(rect.left + delta[0] * distance, rect.top + delta[1] * distance);
    };
    const resize = () => setPosition(previous => {
      const rect = container.current?.getBoundingClientRect();
      return previous && rect ? clampVoicePosition(previous, rect.width, rect.height, window.innerWidth, window.innerHeight) : previous;
    });
    resize();
    host.addEventListener('pointerdown', down);
    host.addEventListener('keydown', keyboard);
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('resize', resize);
    return () => {
      host.removeEventListener('pointerdown', down);
      host.removeEventListener('keydown', keyboard);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('resize', resize);
    };
  }, [active, host, container]);
  return position ? { left: position.left, top: position.top, right: "auto" } : undefined;
}
