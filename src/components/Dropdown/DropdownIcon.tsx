"use client";

import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { DropdowmMenu } from "./DropdownMenu";
import { type IDropdownIcon } from "./interface";
import useClickAway from "@/hooks/use-clickaway";
import { createPortal } from "react-dom";
import { cn, isEmpty } from "@/utility";

export function DropdownIcon({
  icon = null,
  children = null,
  className = "",
  ...props
}: IDropdownIcon & { children?: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    placement: "bottom" as "top" | "bottom",
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ref = useClickAway(() => setOpen(false));

  // Function to calculate and update position with viewport boundary detection
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Estimate dropdown dimensions
      const dropdownHeight = 200; // Approximate height
      const dropdownWidth = 167; // Use minimum width from DropdownMenu

      // Determine vertical placement
      const spaceBelow = viewport.height - rect.bottom;
      const spaceAbove = rect.top;
      const shouldPlaceAbove =
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      // Calculate horizontal position - align with button's left edge
      let left = rect.left;

      // Check if dropdown would overflow on the right
      if (left + dropdownWidth > viewport.width - 8) {
        // Align to the right edge of the button
        left = rect.right - dropdownWidth;

        // If still overflowing, position it to fit within viewport
        if (left < 8) {
          left = 8;
        }
      }

      // Ensure minimum margin from viewport edges
      left = Math.max(8, Math.min(left, viewport.width - dropdownWidth - 8));

      setPosition({
        top: shouldPlaceAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left,
        width: rect.width,
        placement: shouldPlaceAbove ? "top" : "bottom",
      });
    }
  }, []);

  // Calculate initial position when dropdown opens
  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  // Update position on scroll and resize
  useLayoutEffect(() => {
    if (!open) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    document.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
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

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((p) => !p)}
        className={cn("", {
          [className]: !isEmpty(className),
          ["aspect-square size-8 shrink-0 flex items-center justify-center rounded-lg p-2 hover:bg-sand-2"]:
            !isEmpty(icon),
        })}
      >
        {children || icon}
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
              {...{ ...props, onSelect: handleSelect }}
              className={`${position.placement === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-0`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
