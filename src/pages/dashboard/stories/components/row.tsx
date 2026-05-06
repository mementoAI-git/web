import ImageThumbnail from "@/components/image-thumbnail";
import { MemoryItemActions } from "./dropdown";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { tagColors } from "@/utility/constant";
import { isEmpty } from "@/utility";
import { DocsClipIcon } from "@/components/icons";
import type { IMemory } from "@/utility/interface";
import { useModal } from "@/hooks/use-modal";
import { QuickCaptureProcessingBadge } from "@/components/memory/quick-capture-processing-badge";

function getStoryRowTitle(memory: IMemory): string {
  if (memory.prompt_type && memory.prompt_text?.trim()) {
    return memory.prompt_text.trim();
  }
  return memory.title;
}

export default function StoriesTableRow({ memory }: { memory: IMemory }) {
  const navigate = useNavigate();
  const { open } = useModal();
  const rowTitle = getStoryRowTitle(memory);

  const handleClick = () => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      navigate(`/stories/${memory?._id}`);
    } else {
      open("view-memory", { memoryId: memory._id });
    }
  };

  return (
    <tr>
      <td onClick={handleClick}>
        <div className="flex cursor-pointer items-center gap-2">
          <div className="h-10 flex items-center justify-center w-[46.87px] min-w-[33.53px]">
            {
              isEmpty(memory?.attachments) ?
                <div className="size-[33.53px] rounded-[5.83px] justify-center items-center flex bg-v3-fill-weaker">
                  <DocsClipIcon width={17} className="text-v3-text-weaker" />
                </div> :
                <ImageThumbnail images={memory?.attachments} size={33.53} />
            }
          </div>
          <span className="max-w-75 truncate font-inter text-sm font-medium whitespace-nowrap text-v3-text-strong">
            {" "}
            {rowTitle}
          </span>
          <QuickCaptureProcessingBadge memory={memory} />
        </div>
      </td>
      <td className="text-sm whitespace-nowrap text-v3-text-weak">
        {dayjs(memory.created_at).format("MMM DD, YYYY")}
      </td>
      <td>
        <div className="flex items-center gap-1">
          {
            memory.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`mem-tags whitespace-nowrap truncate-ellipsis ${tagColors[tag] || ""} `}>
                {tag}
              </span>
            ))
          }
          {
            memory.tags.length > 3 &&
            <span className="mem-tags">+{memory.tags.length - 3}</span>
          }
        </div>
      </td>
      <td className="w-fit">
        <MemoryItemActions memory={memory} />
      </td>
    </tr>
  );
}