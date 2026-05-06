"use client";

import { useEffect, useRef, useState } from "react";
import useClickAway from "@/hooks/use-clickaway";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkInputProps {
  show: boolean;
  position: { top: number; left: number };
  initialUrl?: string;
  initialText?: string;
  onSubmit: (text: string, url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const linkFieldClass = cn(
  "min-w-[280px] rounded-lg md:text-sm h-auto py-2",
  "border-stroke-neutral-weak bg-transparent text-text-neutral-strong",
  "placeholder:text-neutral-weak",
);

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
      className="fixed z-50 rounded-xl border border-stroke-neutral-weak bg-popover p-3 text-popover-foreground shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text to display..."
          className={linkFieldClass}
        />
        <Input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Enter URL..."
          className={linkFieldClass}
        />
        <div className="flex justify-end gap-2 pt-0.5">
          {initialUrl && onRemove && (
            <Button type="button" variant="destructive" size="sm" onClick={handleRemove} className="rounded-lg">
              Remove
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg border border-transparent bg-fill-brand-strong text-primary-foreground shadow-none",
              "hover:bg-fill-brand-strong/90 hover:text-primary-foreground focus-visible:border-ring",
            )}
          >
            {initialUrl ? "Update" : "Insert"}
          </Button>
        </div>
      </form>
    </div>
  );
}
