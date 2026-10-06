import type { ReactNode, SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "isomorphic-dompurify";
import dayjs from "dayjs";
import { Calendar1Icon } from "@/components/icons";
import { CommandItem } from "@/components/ui/command";
import { useModal } from "@/hooks/use-modal";
import { inferMimeType, uploadMimeBaseType } from "@/utility/constant";
import type { IMemory } from "@/utility/interface";

interface SearchItemProps {
  memory: IMemory;
  searchTerm?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text: string, searchTerm: string): ReactNode {
  const keywords = searchTerm
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!text || keywords.length === 0) return text;

  const pattern = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");

  return text.split(pattern).map((part, index) =>
    keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-v3-brand-strong/15 px-0.5 font-semibold text-inherit"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function getPreviewText(body: string) {
  const plainText = DOMPurify.sanitize(body || "", {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length > 150
    ? `${plainText.slice(0, 150).trimEnd()}…`
    : plainText;
}

export default function SearchItem({
  memory,
  searchTerm = "",
}: SearchItemProps) {
  const { close } = useModal();
  const navigate = useNavigate();

  const handleMemorySelect = () => {
    navigate(`/memories/${memory?._id}`);
    close?.("search-memory");
  };

  const imageAttachment = memory.attachments?.find((attachment) => {
    const mimeType = uploadMimeBaseType(
      attachment.type ||
        inferMimeType(attachment.name) ||
        inferMimeType(attachment.url),
    );
    return Boolean(attachment.url) && mimeType.startsWith("image/");
  });
  const fallbackImage = `https://api.dicebear.com/10.x/disco/svg?seed=${encodeURIComponent(memory._id)}`;
  const previewImage = imageAttachment?.url || fallbackImage;
  const previewAlt = imageAttachment?.name || memory.title || "Memory";

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== fallbackImage) {
      event.currentTarget.src = fallbackImage;
    }
  };

  const previewText = getPreviewText(memory?.body || "");

  return (
    <CommandItem
      value={`${memory._id} ${memory.title} ${previewText}`}
      onSelect={handleMemorySelect}
      className="[&>svg:last-child]:hidden"
    >
      <img
        src={previewImage}
        alt={previewAlt}
        className="size-11 shrink-0 rounded-lg object-cover shadow-sm"
        onError={handleImageError}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-1 font-inter text-sm font-semibold text-v3-text-strong">
          {highlightMatches(memory?.title || "", searchTerm)}
        </span>
        <span className="line-clamp-1 font-inter text-xs text-v3-text-weak">
          {highlightMatches(previewText, searchTerm)}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-v3-text-weaker">
        <Calendar1Icon width={14} height={14} aria-hidden />
        <span className="hidden sm:inline">
          {dayjs(memory?.created_at).format("MMM DD, YYYY")}
        </span>
        <span className="sm:hidden">
          {dayjs(memory?.created_at).format("MMM DD")}
        </span>
      </span>
    </CommandItem>
  );
}
