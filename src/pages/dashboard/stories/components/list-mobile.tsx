import { storyDestination } from "@/lib/story-destination";
import { DeletedMemoryStatus } from "./deleted-memory-status";
import { QuickCaptureProcessingBadge } from "@/components/memory/quick-capture-processing-badge";
import { MemoryItemActions } from "./dropdown";
import { StoryListThumbnail } from "./list-thumbnail";
import type { IMemory, IPagination } from "@/utility/interface";
import { StoryRowMeta } from "./story-row-meta";
import { useNavigate } from "react-router-dom";

function getStoryRowTitle(memory: IMemory): string {
  if (memory.prompt_type && memory.prompt_text?.trim()) {
    return memory.prompt_text.trim();
  }
  return memory.title;
}

function MobileStoryCard({ memory }: { memory: IMemory }) {
  const navigate = useNavigate();
  const rowTitle = getStoryRowTitle(memory);

  return (
    <article
      className="rounded-2xl border border-v3-stroke-weak bg-fill-neutral-weak p-4 transition-colors active:bg-fill-neutral-weaker"
      onClick={() => { if (memory.status !== "deleted") navigate(storyDestination(memory)); }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (memory.status !== "deleted") navigate(storyDestination(memory));
        }
      }}
    >
      <div className="flex items-center gap-3">
        <StoryListThumbnail memory={memory} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate font-inter text-[15px] font-semibold leading-snug text-v3-text-strong">
              {rowTitle}
            </h3>
            <QuickCaptureProcessingBadge memory={memory} />
          </div>
          {memory.status === "deleted" ? <div className="mt-1"><DeletedMemoryStatus memory={memory} showDeletedAt /></div> : <StoryRowMeta memory={memory} className="mt-1 font-inter text-[11px] uppercase tracking-[0.12em] text-v3-text-weaker" />}
        </div>

        <div
          className="-mr-1 shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <MemoryItemActions memory={memory} />
        </div>
      </div>
    </article>
  );
}

type StoriesMobileListProps = {
  data?: Pick<IPagination<IMemory>, "docs">;
  loading?: boolean;
  emptyState?: React.ReactNode;
};

export function StoriesMobileList({
  data,
  loading = false,
  emptyState,
}: StoriesMobileListProps) {
  const docs = data?.docs ?? [];
  const showEmpty = !loading && docs.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[74px] animate-pulse rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker"
            />
          ))
        ) : showEmpty ? (
          emptyState
        ) : (
          docs.map((memory) => <MobileStoryCard key={memory._id} memory={memory} />)
        )}
      </div>
    </div>
  );
}
