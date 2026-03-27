"use client";

import { type KeyboardEvent, useCallback, useId, useRef, useState } from "react";
import { isEmpty } from "lodash";
import { ArrowUp } from "lucide-react";
import Spinner from "@/components/spinner";

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return <ArrowUp {...props} />;
}

export interface DashboardChatInputPayload {
  text: string;
  attachments?: never[];
}

interface DashboardChatInputProps {
  onSend?: (payload: DashboardChatInputPayload) => void;
  loading?: boolean;
}

export function DashboardChatInput({ onSend, loading = false }: DashboardChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend?.({ text: trimmed, attachments: [] });
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, loading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) handleSend();
    }
  };

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-solid border-transparent bg-v3-fill-weak p-2 transition-[border-color] duration-150 focus-within:border-[var(--v3-brand-strong)]">
      <label htmlFor={inputId} className="sr-only">
        Chat message
      </label>
      <textarea
        id={inputId}
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onInput={adjustHeight}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="min-h-[40px] w-full resize-none rounded-lg bg-transparent px-0 py-2 font-inter text-sm outline-none placeholder:text-gray-400 focus:ring-0"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || isEmpty(text.trim())}
          className="flex size-9 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {loading ? (
            <Spinner loading className="!size-4" />
          ) : (
            <ArrowUpIcon className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}
