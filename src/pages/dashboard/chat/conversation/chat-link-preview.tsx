import { ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";
import type { ConversationLinkAsset } from "./conversation-assets";
import { sameUrl, shortUrl } from "./chat-link-utils";
import { OpenIcon } from "./chat-memory-links";

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

type LinkPreviewData = {
  url: string;
  domain?: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
};

/**
 * Card for a link shared in a message, shown above the bubble like other
 * media. Same shape as the story cards under replies: preview image, title,
 * site, open icon.
 */
export function ChatLinkCard({ href, links }: { href: string; links: ConversationLinkAsset[] }) {
  const stored = links.find((link) => sameUrl(link.url, href));
  const { data } = useSWR<IResponse<LinkPreviewData>>(
    `${endpoint.linkPreview}?url=${encodeURIComponent(href)}`,
    { revalidateOnFocus: false, revalidateIfStale: false, shouldRetryOnError: false },
  );
  const preview = data?.data;
  const [imageFailed, setImageFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const host = (preview?.domain || (stored ? linkHost(stored) : shortUrl(href).split("/")[0])).replace(/^www\./, "");
  const title = preview?.title || stored?.title || host;
  const image = imageFailed ? undefined : preview?.image;
  const favicon = iconFailed ? undefined : preview?.favicon || stored?.favicon;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      aria-label={`Open ${title}`}
      className="flex h-14 w-[460px] max-w-full items-center gap-3 rounded-[12px] bg-fill-neutral-weaker p-2 pr-3 font-geist text-text-neutral-strong no-underline transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-fill-neutral-weak">
        {image ? (
          <img src={image} alt="" loading="lazy" onError={() => setImageFailed(true)} className="size-full object-cover" />
        ) : favicon ? (
          <img src={favicon} alt="" onError={() => setIconFailed(true)} className="size-5 rounded-sm object-contain" />
        ) : (
          <Link2 className="size-5 text-icon-neutral-strong" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium leading-5">{title}</span>
        <span className="truncate text-xs leading-4 text-text-neutral-weak">{shortUrl(href)}</span>
      </span>
      <OpenIcon />
    </a>
  );
}
