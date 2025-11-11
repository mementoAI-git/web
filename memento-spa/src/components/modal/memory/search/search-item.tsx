import { useNavigate } from "react-router-dom";
import { Calendar1Icon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { getCategory, highlightText } from "@/utility";
import dayjs from "dayjs";
import type { IMemory } from "@/utility/interface";

interface SearchItemProps {
  memory: IMemory;
  searchTerm?: string;
}

export default function SearchItem({ memory, searchTerm = "" }: SearchItemProps) {
  const { close } = useModal();
  const navigate = useNavigate();

  const handleMemoryClick = () => {
    navigate(`/memories/${memory?._id}`);
    close?.("search-memory");
  };

  const highlightedTitle = highlightText(memory?.title || "", searchTerm);
  const highlightedBody = highlightText(memory?.body || "", searchTerm);

  const truncatedBody =
    highlightedBody.length > 150 ? `${highlightedBody.substring(0, 150)}...` : highlightedBody;

  const previewImage = memory?.attachments?.[0]?.url || getCategory(memory?.category)?.image || "";
  const previewAlt = memory?.attachments?.[0]?.name || memory?.category || memory?.title || "Memory";

  return (
    <div
      onClick={handleMemoryClick}
      className="flex cursor-pointer items-start gap-3 border-b border-gray-200 py-2 sm:gap-4 md:gap-6"
    >
      <img src={previewImage} alt={previewAlt} className="size-10 rounded-lg object-cover" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 font-inter">
        <span className="flex items-center gap-1 text-xs text-[#949494]">
          <Calendar1Icon width={16} height={16} />
          <span>{dayjs(memory?.created_at).format("MMM DD, YYYY")}</span>
        </span>
        <h5
          className="font-georgia text-sm text-gray-800 line-clamp-1 sm:text-xl"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <span
          className="font-inter text-xs text-gray-700 line-clamp-2 sm:text-sm"
          dangerouslySetInnerHTML={{ __html: truncatedBody }}
        />
      </div>
    </div>
  );
}