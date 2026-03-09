import { useNavigate } from "react-router-dom";
import { Calendar1Icon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { ensureLinksOpenInNewTab, getCategory, highlightText } from "@/utility";
import dayjs from "dayjs";
import type { IMemory } from "@/utility/interface";

interface SearchItemProps {
  memory: IMemory;
  searchTerm?: string;
  isActive?: boolean;
  itemId?: string;
}

export default function SearchItem({ memory, searchTerm = "", isActive = false, itemId }: SearchItemProps) {
  const { close } = useModal();
  const navigate = useNavigate();

  const handleMemoryClick = () => {
    navigate(`/memories/${memory?._id}`);
    close?.("search-memory");
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const categoryImage = getCategory(memory?.category)?.image;
    if (e.currentTarget.src !== categoryImage) {
      e.currentTarget.src = categoryImage || getCategory("career")?.image || "";
    }
  };

  const highlightedTitle = highlightText(memory?.title || "", searchTerm);
  const highlightedBody = highlightText(memory?.body || "", searchTerm);

  const truncatedBody =
    highlightedBody.length > 150 ? `${highlightedBody.substring(0, 150)}...` : highlightedBody;

  const previewImage = memory?.attachments?.[0]?.url || getCategory(memory?.category)?.image || "";
  const previewAlt = memory?.attachments?.[0]?.name || memory?.category || memory?.title || "Memory";

  return (
    <div
      id={itemId}
      role="option"
      aria-selected={isActive}
      onClick={handleMemoryClick}
      className={`
        flex cursor-pointer items-center gap-3 py-3 px-3 rounded-lg
        transition-all duration-150
        ${isActive ? 'bg-blue-50 shadow-sm' : 'hover:bg-gray-50'}
      `}
    >
      <img
        src={previewImage}
        alt={previewAlt}
        className="size-12 rounded-lg object-cover shrink-0 shadow-sm"
        onError={handleImageError}
        loading="lazy"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h5
          className="font-inter font-medium text-sm text-gray-900 line-clamp-1"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <span
          className="font-inter text-xs text-gray-500 line-clamp-1"
          dangerouslySetInnerHTML={{ __html: ensureLinksOpenInNewTab(truncatedBody) }}
        />
      </div>
      <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
        <Calendar1Icon width={14} height={14} />
        <span className="hidden sm:inline">{dayjs(memory?.created_at).format("MMM DD, YYYY")}</span>
        <span className="sm:hidden">{dayjs(memory?.created_at).format("MMM DD")}</span>
      </span>
    </div>
  );
}