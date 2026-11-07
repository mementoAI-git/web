import { Check, Undo2 } from "lucide-react";
import { useState } from "react";
import endpoint from "@/api/endpoint";
import { post } from "@/api/mutations";
import { cn } from "@/utility";
import { refreshAfterChatAction } from "./chat-refresh";
import type { ChatDone } from "./memento-links";

type DoneState = { kind: "done" } | { kind: "working" } | { kind: "undone"; text: string } | { kind: "failed"; text: string };

/** Something Memento did straight away, with Undo for half an hour. */
export function ChatDoneCard({ done }: { done: ChatDone }) {
  const [state, setState] = useState<DoneState>(done.undone ? { kind: "undone", text: "Undone." } : { kind: "done" });

  const undo = async () => {
    if (!done.action) return;
    setState({ kind: "working" });
    try {
      const response = await post<{ done: boolean; text: string; effects: unknown[] }>(endpoint.chatUndo, {
        memory: done.memory,
        action: done.action,
      });
      refreshAfterChatAction(response.data?.effects);
      const text = response.data?.text || "Undone.";
      setState(response.data?.done ? { kind: "undone", text } : { kind: "failed", text });
    } catch (error) {
      setState({ kind: "failed", text: (error as { message?: string } | null)?.message || "That didn't go through. Try again, or change it in the app." });
    }
  };

  const undone = state.kind === "undone";
  return (
    <div
      role="group"
      aria-label="What Memento did"
      className="flex w-full max-w-[380px] items-center gap-2 rounded-[12px] border border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2 font-geist"
    >
      {undone ? <Undo2 className="size-4 shrink-0 text-icon-neutral-weak" aria-hidden /> : <Check className="size-4 shrink-0 text-icon-neutral-weak" aria-hidden />}
      <p role="status" className={cn("min-w-0 flex-1 text-sm leading-5", state.kind === "failed" ? "text-text-error-strong" : "text-text-neutral-strong", undone && "text-text-neutral-weak")}>
        {state.kind === "done" || state.kind === "working" ? done.text : state.text}
      </p>
      {done.action && (state.kind === "done" || state.kind === "working") ? (
        <button
          type="button"
          onClick={() => void undo()}
          disabled={state.kind === "working"}
          aria-busy={state.kind === "working"}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-text-brand-strong transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong disabled:opacity-60"
        >
          {state.kind === "working" ? "Undoing…" : "Undo"}
        </button>
      ) : null}
    </div>
  );
}
