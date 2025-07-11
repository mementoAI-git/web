import ImageThumbnail from "@/components/ImageThumbnail";
import { useModal } from "@/hooks/use-modal";
import CalendarIcon from "@/public/icon/calendar-1.svg"
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { highlightText } from "@/utility";

export default function SearchItem({ memory, searchTerm = "" }) {
  const { close } = useModal();
  const router = useRouter();

  const handleMemoryClick = () => {
    router.push(`/memories/${memory?._id}`);
    close("search-memory");
  };

  const highlightedTitle = highlightText(memory?.title || "", searchTerm);
  const highlightedBody = highlightText(memory?.body || "", searchTerm);

  return (
    <div onClick={handleMemoryClick} className="flex gap-6 py-2 items-start border-grey-400 border-b last:border-0">
      <div className="w-24 flex justify-center h-20.5 shrink-0">
        <ImageThumbnail images={memory?.attachments} size={70} />
      </div>
      <div className="flex-1 flex gap-2 flex-col font-inter">
        <h5
          className="font-inter font-semibold text-secondary"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <span className="text-xs flex items-center gap-1 text-grey-800">
          <CalendarIcon width={16} height={16} />
          <span>{dayjs(memory?.created_at).format("MMM DD, YYYY")}</span>
        </span>
        <span
          className="text-grey-800 text-sm"
          dangerouslySetInnerHTML={{ __html: highlightedBody }}
        />
      </div>
    </div>
  )
}