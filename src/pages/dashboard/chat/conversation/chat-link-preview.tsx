import { ExternalLink } from "lucide-react";
import type { ConversationLinkAsset } from "./conversation-assets";

function linkHost(link: ConversationLinkAsset) {
  if (link.domain) return link.domain;
  try {
    return new URL(link.url).hostname;
  } catch {
    return link.url;
  }
}

export function ChatLinkPreview({ link }: { link: ConversationLinkAsset }) {
  const hasMetadata = Boolean(link.title || link.domain || link.favicon);
  if (!hasMetadata) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-full break-all font-geist text-base leading-6 text-text-brand-strong underline underline-offset-2 hover:opacity-80"
      >
        {link.url}
      </a>
    );
  }

  const host = linkHost(link);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${link.title || host}`}
      className="flex min-w-0 max-w-full flex-col gap-1 rounded-md bg-fill-neutral-weaker p-1 font-geist text-text-neutral-strong no-underline transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      {link.title ? (
        <span className="truncate text-base leading-6">{link.title}</span>
      ) : null}
      <span className="flex min-w-0 items-center gap-1.5">
        {link.favicon ? (
          <img src={link.favicon} alt="" className="size-5 shrink-0 rounded-sm object-cover" />
        ) : null}
        <span className="min-w-0 truncate text-xs text-text-neutral-weak">{host}</span>
        <ExternalLink className="size-3.5 shrink-0 text-icon-neutral-weaker" aria-hidden />
      </span>
    </a>
  );
}
