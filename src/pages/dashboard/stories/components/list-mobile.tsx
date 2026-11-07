import { storyDestination } from "@/lib/story-destination";
import { DeletedMemoryStatus } from "./deleted-memory-status";
import ImageThumbnail from "@/components/image-thumbnail";
import { QuickCaptureProcessingBadge } from "@/components/memory/quick-capture-processing-badge";
import { Button } from "@/components/ui/button";
import { DocsClipIcon } from "@/components/icons";
import { MemoryItemActions } from "./dropdown";
import { isEmpty } from "@/utility";
import type { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
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
      className="rounded-2xl border border-v3-stroke-weak bg-bg-neutral-solid p-4 shadow-sm transition-colors active:bg-v3-fill-weaker/50"
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
        <div className="flex size-8 shrink-0 items-center justify-center">
          {isEmpty(memory.attachments) ? (
            <div className="flex size-8 items-center justify-center rounded-lg bg-v3-fill-weaker">
              <DocsClipIcon width={16} className="text-v3-text-weaker" />
            </div>
          ) : (
            <ImageThumbnail images={memory.attachments.slice(0, 1)} size={32} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 font-inter text-[15px] font-semibold leading-snug text-v3-text-strong">
              {rowTitle}
            </h3>
            <QuickCaptureProcessingBadge memory={memory} />
          </div>
          {memory.status === "deleted" ? <div className="mt-1"><DeletedMemoryStatus memory={memory} showDeletedAt /></div> : <p className="mt-1 font-inter text-[11px] uppercase tracking-[0.12em] text-v3-text-weaker">
            {dayjs(memory.created_at).format("MMM DD, YYYY")}
          </p>}
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
  data?: IPagination<IMemory>;
  loading?: boolean;
  onChangePage?: (page: number) => void;
  emptyState?: React.ReactNode;
};

export function StoriesMobileList({
  data,
  loading = false,
  onChangePage,
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

      <div className="flex items-center justify-between gap-3 rounded-[18px] border border-v3-stroke-weak bg-bg-neutral-solid px-4 py-3 shadow-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!data?.hasPrevPage}
          onClick={() => data?.hasPrevPage && onChangePage?.(data.prevPage)}
          className="rounded-[10px] border-v3-stroke-weak bg-bg-neutral-solid px-3 text-xs font-semibold text-v3-text-strong hover:bg-v3-fill-weaker"
        >
          Previous
        </Button>
        <span className="font-inter text-xs font-medium text-v3-text-strong">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!data?.hasNextPage}
          onClick={() => data?.hasNextPage && onChangePage?.(data.nextPage)}
          className="rounded-[10px] border-v3-stroke-weak bg-bg-neutral-solid px-3 text-xs font-semibold text-v3-text-strong hover:bg-v3-fill-weaker"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
