import { isAxiosError } from "axios";
import { BookOpen, Check, ExternalLink, MessageCircle, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import useSWR, { mutate } from "swr";
import { post } from "@/api/mutations";
import { Button } from "@/components/ui/button";
import endpoint from "@/api/endpoint";
import { cn } from "@/utility";
import type { IResponse } from "@/api/interface";
import dayjs from "dayjs";
import type { IMemory, IPublicMemory } from "@/utility/interface";
import { collectReplySources, type ChatConfirmation, type MementoLink } from "./memento-links";

/** Cards and chips for Memento links in chat replies (see ./memento-links). */

/** A story or conversation named in a reply: a plain link that opens it in the app. */
export function MementoLinkChip({ link, children }: { link: Extract<MementoLink, { to: string }>; children: ReactNode }) {
  return (
    <Link
      to={link.to}
      className="font-medium text-text-brand-strong underline decoration-1 underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      {children}
    </Link>
  );
}

/** The open icon on story cards. */
function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 shrink-0">
      <path
        d="M6 6H10V10M10 6L6 10M14.667 8A6.667 6.667 0 1 1 1.333 8a6.667 6.667 0 0 1 13.334 0Z"
        stroke="currentColor"
        strokeWidth="1.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function thumbnailOf(memory?: Partial<IMemory>) {
  const files = (memory?.attachments ?? []) as unknown[];
  for (const file of files) {
    if (!file || typeof file !== "object") continue;
    const { thumbnail, url, type } = file as { thumbnail?: string | null; url?: string; type?: string };
    if (thumbnail) return thumbnail;
    if (url && type?.startsWith("image")) return url;
  }
  return null;
}

/** A story or conversation a reply pointed to, as a card that opens it. */
export function ChatStoryCard({ source }: { source: { kind: "story" | "conversation"; id: string; to: string; label: string } }) {
  const { data } = useSWR<IResponse<IMemory>>(source.kind === "story" ? `${endpoint.memories}/${source.id}` : null);
  const memory = data?.data;
  const thumbnail = thumbnailOf(memory);
  const title = memory?.title?.trim() || source.label;
  const date = memory?.created_at && dayjs(memory.created_at).isValid() ? dayjs(memory.created_at).format("MMM D, YYYY") : null;
  const kind = source.kind === "story" ? "Story" : "Conversation";
  const Icon = source.kind === "story" ? BookOpen : MessageCircle;
  return (
    <Link
      to={source.to}
      aria-label={`Open ${kind.toLowerCase()}: ${title}`}
      className="flex h-14 w-[236px] max-w-full items-center gap-3 rounded-[12px] bg-fill-neutral-weaker p-2 pr-3 font-geist text-text-neutral-strong no-underline transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-fill-neutral-weaker">
        {thumbnail ? <img src={thumbnail} alt="" className="size-full object-cover" /> : <Icon className="size-4 text-icon-neutral-weak" aria-hidden />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium leading-5">{title}</span>
        <span className="truncate text-xs leading-4 text-text-neutral-weak">{date ? `${kind} · ${date}` : kind}</span>
      </span>
      <OpenIcon />
    </Link>
  );
}

/** The memories a reply pointed to, as cards under it. */
export function ChatReplySources({ text }: { text: string }) {
  const sources = collectReplySources(text);
  if (!sources.length) return null;
  return (
    <nav aria-label="Sources" className="mt-1.5 flex max-w-full flex-wrap gap-2">
      {sources.map((source) => <ChatStoryCard key={source.id} source={source} />)}
    </nav>
  );
}

function excerpt(body = "", max = 140) {
  const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function coverOf(memory?: IPublicMemory) {
  const image = memory?.attachments?.find((file) => file.thumbnail || file.type?.startsWith("image"));
  return image ? image.thumbnail || image.url : null;
}

/** A shared story's link as a preview card, like the one other apps show. */
export function ChatShareCard({ link, compact = false }: { link: Extract<MementoLink, { kind: "share" }>; compact?: boolean }) {
  const { data, error } = useSWR<IResponse<IPublicMemory>>(`${endpoint.publicMemory}/${link.id}`);
  const memory = data?.data;
  const cover = coverOf(memory);
  const host = new URL(link.url).host.replace(/^www\./, "");
  if (error || (!memory && data)) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="break-all text-text-brand-strong underline underline-offset-2 hover:opacity-80">
        {link.url}
      </a>
    );
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={memory ? `Open shared story: ${memory.title || "Untitled"}` : "Open shared story"}
      aria-busy={!memory}
      className={cn(
        "my-1 flex w-full max-w-[340px] flex-col overflow-hidden rounded-[12px] border border-stroke-neutral-weak bg-fill-neutral-weaker font-geist text-text-neutral-strong no-underline transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong",
      )}
    >
      {cover ? <img src={cover} alt="" className={cn("block w-full object-cover", compact ? "h-24" : "h-36")} /> : null}
      <span className="flex min-w-0 flex-col gap-0.5 p-2.5">
        <span className={cn("truncate font-medium", compact ? "text-sm" : "text-base leading-6")}>
          {memory ? memory.title || "Untitled story" : "Loading story…"}
        </span>
        {memory?.body ? <span className="line-clamp-2 text-sm leading-5 text-text-neutral-weak">{excerpt(memory.body)}</span> : null}
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-text-neutral-weak">
          <span className="truncate">{host}</span>
          <ExternalLink className="size-3 shrink-0 text-icon-neutral-weaker" aria-hidden />
        </span>
      </span>
    </a>
  );
}

/** Cached screens to refresh after an action, by what it changed. */
const REFRESH_PREFIXES: Record<string, string[]> = {
  profile: [endpoint.profile, endpoint.userStats],
  memories: [endpoint.memories],
  capsules: [endpoint.capsule],
  beneficiaries: [endpoint.beneficiaries],
  observations: [endpoint.personaObservations],
};

function refreshAfter(effects: unknown) {
  if (!Array.isArray(effects)) return;
  for (const effect of effects) {
    const prefixes = effect && typeof effect === "object" && (effect as { type?: string }).type === "refresh"
      ? REFRESH_PREFIXES[String((effect as { what?: string }).what)]
      : undefined;
    if (prefixes) void mutate((key) => typeof key === "string" && prefixes.some((prefix) => key.startsWith(prefix)));
  }
}

type CardState = { kind: "waiting" } | { kind: "working" } | { kind: "done"; text: string } | { kind: "cancelled" } | { kind: "failed"; text: string };

/**
 * An action Memento will take once the host confirms it (delete a story,
 * share it, invite someone…). Nothing happens until Confirm is pressed.
 */
export function ChatConfirmCard({ card }: { card: ChatConfirmation }) {
  const [state, setState] = useState<CardState>(card.confirmed ? { kind: "done", text: "Done." } : { kind: "waiting" });

  const confirm = async () => {
    setState({ kind: "working" });
    try {
      const response = await post<{ done: boolean; text: string; effects: unknown[] }>(`${endpoint.chatActions}/${card.tool}`, {
        memory: card.memory,
        args: card.args,
      });
      refreshAfter(response.data?.effects);
      const text = response.data?.text || "Done.";
      setState(response.data?.done ? { kind: "done", text } : { kind: "failed", text });
    } catch (error) {
      // The API client rejects with its normalised error, which carries the server's message.
      const message = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : (error as { message?: string } | null)?.message;
      setState({ kind: "failed", text: message || "That didn't go through. Try again, or do it in the app." });
    }
  };

  const settled = state.kind === "done" || state.kind === "cancelled" || state.kind === "failed";
  return (
    <div
      role="group"
      aria-label="Confirm this action"
      className="flex w-full max-w-[380px] flex-col gap-2 rounded-[12px] border border-stroke-neutral-weak bg-fill-neutral-weaker p-3 font-geist"
    >
      <p className="text-sm leading-5 text-text-neutral-strong">{card.text}</p>
      {settled ? (
        <p role="status" className={cn("flex items-center gap-1.5 text-sm leading-5", state.kind === "failed" ? "text-text-error-strong" : "text-text-neutral-weak")}>
          {state.kind === "done" ? <Check className="size-4 shrink-0" aria-hidden /> : state.kind === "cancelled" ? <X className="size-4 shrink-0" aria-hidden /> : null}
          {state.kind === "cancelled" ? "Cancelled. Nothing was changed." : state.text}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void confirm()} disabled={state.kind === "working"} aria-busy={state.kind === "working"}>
            {state.kind === "working" ? "Working…" : "Confirm"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-stroke-neutral-weak text-text-neutral-strong"
            onClick={() => setState({ kind: "cancelled" })}
            disabled={state.kind === "working"}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
