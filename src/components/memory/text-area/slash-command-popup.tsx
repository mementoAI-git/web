"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import useClickAway from "@/hooks/use-clickaway";
import { SLASH_COMMANDS } from "./slash-commands";

export interface SlashCommandDisplayItem {
  icon: ReactNode;
  label: string;
  shortcut?: string;
}

interface SlashCommandPopupProps {
  show: boolean;
  position: { top: number; left: number };
  /** Commands to show (e.g. SLASH_COMMANDS or filtered list). Defaults to SLASH_COMMANDS when omitted. */
  commands?: SlashCommandDisplayItem[];
  onCommandSelect: (command: SlashCommandDisplayItem & Record<string, unknown>) => void;
  onClose: () => void;
  /** Highlighted index for keyboard nav. When set with onSelectedIndexChange, Arrow Up/Down and Enter are handled. */
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

export function SlashCommandPopup({
  show,
  position,
  commands = SLASH_COMMANDS,
  onCommandSelect,
  onClose,
  selectedIndex = 0,
  onSelectedIndexChange,
}: SlashCommandPopupProps) {
  const slashMenuRef = useClickAway(onClose);
  const length = commands.length;

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (onSelectedIndexChange && length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onSelectedIndexChange((selectedIndex + 1) % length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onSelectedIndexChange((selectedIndex - 1 + length) % length);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          onCommandSelect(commands[selectedIndex] as SlashCommandDisplayItem & Record<string, unknown>);
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose, length, selectedIndex, onSelectedIndexChange, onCommandSelect, commands]);

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
        {commands.map((cmd, index) => (
          <button
            key={index}
            onClick={() => onCommandSelect(cmd as SlashCommandDisplayItem & Record<string, unknown>)}
            className={`flex cursor-pointer items-center gap-3 px-3 py-0.5 text-left text-xs text-gray-800 transition-colors hover:bg-gray-100 ${
              index === selectedIndex ? "bg-gray-100" : ""
            }`}
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
