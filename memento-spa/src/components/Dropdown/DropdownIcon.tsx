import type { ReactElement, ReactNode } from "react";
import {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import useClickAway from "@/hooks/use-clickaway";
import { cn, isEmpty } from "@/utility";
import type { IDropdownIcon } from "./interface";
import { DropdowmMenu } from "./DropdownMenu";

export function DropdowmIcon({
  icon,
  children,
  className = "",
  ...props
}: IDropdownIcon & { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    placement: "bottom" as "top" | "bottom",
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ref = useClickAway<HTMLDivElement>(() => setOpen(false));

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const dropdownHeight = 200;
    const dropdownWidth = 167;

    const spaceBelow = viewport.height - rect.bottom;
    const spaceAbove = rect.top;
    const shouldPlaceAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + dropdownWidth > viewport.width - 8) {
      left = rect.right - dropdownWidth;
      if (left < 8) {
        left = 8;
      }
    }
    left = Math.max(8, Math.min(left, viewport.width - dropdownWidth - 8));

    setPosition({
      top: shouldPlaceAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left,
      width: rect.width,
      placement: shouldPlaceAbove ? "top" : "bottom",
    });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePosition]);

  function handleSelect(value: string) {
    props.onSelect(value);
    setOpen(false);
  }

  const triggerContent = (children ?? icon) as ReactElement | null;

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn({
          [className]: !isEmpty(className),
          "flex size-8 shrink-0 items-center justify-center rounded-lg p-2 hover:bg-sand-2": triggerContent,
        })}
      >
        {triggerContent}
      </button>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 40,
              minWidth: position.width,
              pointerEvents: "auto",
            }}
          >
            <DropdowmMenu
              {...props}
              onSelect={handleSelect}
              className={`${position.placement === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-0`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
