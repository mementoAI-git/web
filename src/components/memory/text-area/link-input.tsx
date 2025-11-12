"use client";

import { useEffect, useRef, useState } from "react";
import useClickAway from "@/hooks/use-clickaway";

interface LinkInputProps {
  show: boolean;
  position: { top: number; left: number };
  initialUrl?: string;
  initialText?: string;
  onSubmit: (text: string, url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export function LinkInput({
  show,
  position,
  initialUrl = "",
  initialText = "",
  onSubmit,
  onRemove,
  onClose,
}: LinkInputProps) {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const textInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useClickAway(onClose);

  useEffect(() => {
    if (show) {
      setText(initialText);
      setUrl(initialUrl);
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  }, [show, initialUrl, initialText]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim() && url.trim()) {
      onSubmit(text.trim(), url.trim());
      onClose();
    }
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text to display..."
          className="min-w-[280px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Enter URL..."
          className="min-w-[280px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <div className="flex justify-end gap-2">
          {initialUrl && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-6 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-3"
          >
            {initialUrl ? "Update" : "Insert"}
          </button>
        </div>
      </form>
    </div>
  );
}
