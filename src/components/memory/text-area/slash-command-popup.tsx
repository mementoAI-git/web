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
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
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
      className="fixed z-50 min-w-[180px] rounded-lg border border-stroke-neutral-weak bg-white p-1 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {commands.map((cmd, index) => (
        <button
          key={index}
          onClick={() => onCommandSelect(cmd as SlashCommandDisplayItem & Record<string, unknown>)}
          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-text-neutral-strong transition-colors hover:bg-fill-neutral-weaker ${
            index === selectedIndex ? "bg-fill-neutral-weaker" : ""
          }`}
          type="button"
        >
          <span className="flex size-4 shrink-0 items-center justify-center text-text-neutral-weak [&>svg]:size-3.5 [&>span]:text-[10px]">
            {cmd.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
        </button>
      ))}
    </div>
  );
}
