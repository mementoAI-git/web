import { storyDestination } from "@/lib/story-destination";
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
    if (isMobile || memory.prompt_type) {
      navigate(storyDestination(memory));
    } else {
      open("view-memory", { memoryId: memory._id });
    }
  };

  return (
    <tr>
      <td className="w-full" onClick={handleClick}>
        <div className="flex cursor-pointer items-center gap-3">
          <StoryListThumbnail memory={memory} />
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="max-w-75 truncate font-inter text-sm font-medium whitespace-nowrap text-v3-text-strong">
                {rowTitle}
              </span>
              <QuickCaptureProcessingBadge memory={memory} />
            </div>
            {memory.status === "deleted" ? (
              <div className="mt-0.5">
                <DeletedMemoryStatus memory={memory} showDeletedAt inline />
              </div>
            ) : (
              <p className="mt-0.5 font-inter text-xs leading-relaxed whitespace-nowrap text-text-neutral-weak">
                {dayjs(memory.created_at).format("MMM DD, YYYY")}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="w-fit">
        <MemoryItemActions memory={memory} trigger="horizontal" />
      </td>
    </tr>
  );
}
