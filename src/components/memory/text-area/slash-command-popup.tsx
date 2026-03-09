"use client";

import { useEffect } from "react";
import useClickAway from "@/hooks/use-clickaway";
import { SLASH_COMMANDS } from "./slash-commands";

interface SlashCommandPopupProps {
  show: boolean;
  position: { top: number; left: number };
  onCommandSelect: (command: (typeof SLASH_COMMANDS)[0]) => void;
  onClose: () => void;
}

export function SlashCommandPopup({ show, position, onCommandSelect, onClose }: SlashCommandPopupProps) {
  const slashMenuRef = useClickAway(onClose);

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      ref={slashMenuRef}
      className="fixed z-50 flex min-w-[220px] flex-col rounded-xl border border-gray-200 bg-white py-0 shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="px-3 py-0.5">
        <span className="text-xs font-medium text-gray-500">Basic blocks</span>
      </div>
      <div className="flex flex-col">
        {SLASH_COMMANDS.map((cmd, index) => (
          <button
            key={index}
            onClick={() => onCommandSelect(cmd)}
            className="flex cursor-pointer items-center gap-3 px-3 py-0.5 text-left text-xs text-gray-800 transition-colors hover:bg-gray-100"
            type="button"
          >
            <span className="flex size-8 shrink-0 items-center justify-center text-gray-800 [&>svg]:size-4 [&>span]:text-xs">
              {cmd.icon}
            </span>
            <span className="min-w-0 flex-1 truncate font-light">{cmd.label}</span>
            {cmd.shortcut && (
              <span className="shrink-0 text-xs text-gray-500">{cmd.shortcut}</span>
            )}
          </button>
        ))}
      </div>
      <div className="my-1 border-t border-gray-200" />
      <button
        type="button"
        onClick={onClose}
        className="flex cursor-pointer items-center justify-between px-3 py-0.5 text-left text-xs text-gray-800 transition-colors hover:bg-gray-100"
      >
        <span>Close menu</span>
        <span className="text-xs text-gray-500">esc</span>
      </button>
    </div>
  );
}
