import ImageThumbnail from "@/components/ImageThumbnail";
import { useModal } from "@/hooks/use-modal";
import CalendarIcon from "@/public/icon/calendar-1.svg"
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { getCategory, highlightText, isEmpty } from "@/utility";
import Docsclip from "@/public/icon/docs-clip.svg"
import Image from "next/image";

export default function SearchItem({ memory, searchTerm = "" }) {
  const { close } = useModal();
  const router = useRouter();

  const handleMemoryClick = () => {
    router.push(`/memories/${memory?._id}`);
    close("search-memory");
  };

  const highlightedTitle = highlightText(memory?.title || "", searchTerm);
  const highlightedBody = highlightText(memory?.body || "", searchTerm);

  const truncatedBody = highlightedBody.length > 150
    ? highlightedBody.substring(0, 150) + '...'
    : highlightedBody;

  return (
    <div
      onClick={handleMemoryClick}
      className="flex gap-3 cursor-pointer sm:gap-4 md:gap-6 py-2 items-start border-gray-200 border-b"
    >
      <Image
        src={memory?.attachments[0]?.url || getCategory(memory?.category)?.image || ""}
        alt={memory?.attachments[0]?.name || memory?.category || memory?.title}
        width={40}
        height={40}
        className="size-10 rounded-lg object-cover"
      />
      <div className="flex-1 flex gap-1 sm:gap-2 flex-col font-inter min-w-0">
        <span className="text-xs flex items-center gap-1 text-[#949494]">
          <CalendarIcon width={16} height={16} />
          <span>{dayjs(memory?.created_at).format("MMM DD, YYYY")}</span>
        </span>
        <h5
          className="font-georgia text-gray-800 text-sm sm:text-xl line-clamp-1"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <span
          className="text-gray-700 font-inter text-xs sm:text-sm line-clamp-2"
          dangerouslySetInnerHTML={{ __html: truncatedBody }}
        />
      </div>
    </div>
  )
}