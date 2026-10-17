import { DeletedMemoryStatus } from "./deleted-memory-status";
import { StoryListThumbnail } from "./list-thumbnail";
import { MemoryItemActions } from "./dropdown";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
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
    if (memory.status === "deleted") return;
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
        <div className="flex cursor-pointer items-center gap-3">
          <StoryListThumbnail memory={memory} />
          <span className="max-w-75 truncate font-inter text-sm font-medium whitespace-nowrap text-v3-text-strong">
            {" "}
            {rowTitle}
          </span>
          <QuickCaptureProcessingBadge memory={memory} />
        </div>
      </td>
      <td className="text-sm whitespace-nowrap text-v3-text-weak">
        {memory.status === "deleted" ? <DeletedMemoryStatus memory={memory} showDeletedAt /> : dayjs(memory.created_at).format("MMM DD, YYYY")}
      </td>
      <td>
        <div className="flex items-center gap-1">
          {memory.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="stories-table-tag whitespace-nowrap truncate-ellipsis"
            >
              {tag}
            </span>
          ))}
          {memory.tags.length > 3 && (
            <span className="stories-table-tag">+{memory.tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="w-fit">
        <MemoryItemActions memory={memory} />
      </td>
    </tr>
  );
}
