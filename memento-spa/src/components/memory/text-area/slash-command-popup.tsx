"use client";

import useClickAway from "@/hooks/use-clickaway";
import { SLASH_COMMANDS } from "./slash-commands";

interface SlashCommandPopupProps {
  show: boolean;
  position: { top: number; left: number };
  onCommandSelect: (command: (typeof SLASH_COMMANDS)[0]) => void;
  onClose: () => void;
}

export function SlashCommandPopup({ show, position, onCommandSelect, onClose }: SlashCommandPopupProps) {
  const slashMenuRef = useClickAway<HTMLDivElement>(onClose);

  if (!show) return null;

  return (
    <div
      ref={slashMenuRef}
      className="fixed z-50 flex gap-1 rounded bg-sand-1 text-[#344054] shadow-btn"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {SLASH_COMMANDS.map((cmd, index) => (
        <button
          key={index}
          onClick={() => onCommandSelect(cmd)}
          className="flex size-8 cursor-pointer items-center justify-center p-2"
          type="button"
        >
          {cmd.icon}
        </button>
      ))}
    </div>
  );
}
