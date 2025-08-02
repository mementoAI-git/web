"use client";

import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { DropdowmMenu } from "./DropdownMenu";
import { IDropdownIcon } from "./interface";
import useClickAway from "@/hooks/use-clickaway";
import { createPortal } from "react-dom";

export function DropdowmIcon({ icon, ...props }: IDropdownIcon) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ref = useClickAway(() => setOpen(false));

  // Function to calculate and update position
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4, // Using viewport coordinates + gap
        left: rect.left,
        width: rect.width
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

    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleResize);
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
        className="aspect-square shrink-0 hover:bg-[#f5f5f5]/80 rounded-full p-2"
      >
        {icon}
      </button>
      {open &&
        createPortal(
          <div
            style={{
              position: 'fixed', // Fixed positioning relative to viewport
              top: position.top,
              left: position.left,
              zIndex: 9999,
              minWidth: position.width,
              // Prevent the dropdown from being selectable during rapid scrolling
              pointerEvents: 'auto'
            }}
          >
            <DropdowmMenu {...{ ...props, onSelect: handleSelect }} />
          </div>,
          document.body
        )
      }
    </div>
  );
}