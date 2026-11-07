import { BookOpen, ExternalLink, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { cn } from "@/utility";
import type { IResponse } from "@/api/interface";
import type { IPublicMemory } from "@/utility/interface";
import { collectReplySources, type MementoLink } from "./memento-links";

/** Cards and chips for Memento links in chat replies (see ./memento-links). */

const chipClass =
  "inline-flex max-w-full items-baseline gap-1 rounded-md bg-fill-neutral-weaker px-1 align-baseline font-medium text-text-brand-strong no-underline transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong";

/** A story or conversation named in a reply; opens it in the app. */
export function MementoLinkChip({ link, children }: { link: Extract<MementoLink, { to: string }>; children: ReactNode }) {
  const Icon = link.kind === "story" ? BookOpen : MessageCircle;
  return (
    <Link to={link.to} className={chipClass} aria-label={`Open ${link.kind === "story" ? "story" : "conversation"}: ${String(children)}`}>
      <Icon className="size-3.5 shrink-0 translate-y-[2px] text-icon-neutral-weak" aria-hidden />
      <span className="min-w-0 break-words">{children}</span>
    </Link>
  );
}

/** "Sources" under a reply: the memories it pointed to. */
export function ChatReplySources({ text }: { text: string }) {
  const sources = collectReplySources(text);
  if (!sources.length) return null;
  return (
    <nav aria-label="Sources" className="mt-1 flex max-w-full flex-wrap items-center gap-1 px-0.5">
      <span className="font-geist text-xs text-text-neutral-weak">Sources</span>
      {sources.map((source) => {
        const Icon = source.kind === "story" ? BookOpen : MessageCircle;
        return (
          <Link
            key={source.id}
            to={source.to}
            className="inline-flex h-7 max-w-[220px] items-center gap-1.5 rounded-full border border-stroke-neutral-weak px-2.5 font-geist text-xs text-text-neutral-strong no-underline transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
          >
            <Icon className="size-3.5 shrink-0 text-icon-neutral-weak" aria-hidden />
            <span className="truncate">{source.label}</span>
          </Link>
        );
      })}
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
