import ImageThumbnail from "@/components/ImageThumbnail";
import { useModal } from "@/hooks/use-modal";
import CalendarIcon from "@/public/icon/calendar-1.svg"
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { highlightText, isEmpty } from "@/utility";
import Docsclip from "@/public/icon/docs-clip.svg"

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
    <div onClick={handleMemoryClick} className="flex gap-3 sm:gap-4 md:gap-6 py-2 items-start border-grey-400 border-b last:border-0">
      <div className="w-16 sm:w-20 md:w-24 flex justify-center h-16 sm:h-18 md:h-20.5 shrink-0">
        {
          isEmpty(memory?.attachments) ?
            <div className="size-[80%] rounded-[5.83px] justify-center items-center flex bg-grey-500">
              <Docsclip className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </div> :
            <ImageThumbnail
              images={memory?.attachments}
              size={56}
              boxClassName="sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20"
            />
        }
      </div>
      <div className="flex-1 flex gap-1 sm:gap-2 flex-col font-inter min-w-0">
        <h5
          className="font-inter font-semibold text-secondary text-sm sm:text-base line-clamp-2"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <span className="text-xs flex items-center gap-1 text-grey-800">
          <CalendarIcon width={16} height={16} />
          <span>{dayjs(memory?.created_at).format("MMM DD, YYYY")}</span>
        </span>
        <span
          className="text-grey-800 text-xs sm:text-sm line-clamp-2"
          dangerouslySetInnerHTML={{ __html: truncatedBody }}
        />
      </div>
    </div>
  )
}