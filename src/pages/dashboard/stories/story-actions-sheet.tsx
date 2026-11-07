import { Bookmark, BookmarkCheck, Share2, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { putFetcher } from "@/api/fetcher";
import { memoryActionError } from "@/api/memory-lifecycle";
import { moveMemoryToDeleted } from "@/components/modal/memory/move-memory-to-deleted";
import { ShareStoryAudience } from "@/components/modal/memory/share-story-audience";
import { bottomSheetClass } from "@/components/ui/bottom-sheet-class";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useBookmark } from "@/hooks/use-bookmark";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import type { IMemory } from "@/utility/interface";

const rowClass =
  "mb-2.5 flex w-full items-center gap-3.5 rounded-2xl bg-fill-neutral-weak p-4 text-left font-inter text-[15px] leading-[23px] text-text-neutral-strong";

/** The mobile app's story actions sheet: share, bookmark, audience, tags and delete. */
export function StoryActionsSheet({
  memory,
  open,
  onOpenChange,
}: {
  memory: IMemory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { open: openModal } = useModal();
  const { toggleBookmark } = useBookmark({
    memoryId: memory._id,
    isBookmarked: memory.bookmarked,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tags, setTags] = useState<string[] | null>(null);
  const [tagInput, setTagInput] = useState("");
  const currentTags = tags ?? memory.tags ?? [];

  const pendingTags = () => {
    const added = tagInput.split(/[\s,]+/).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    return [...new Set([...currentTags, ...added])];
  };

  const addTags = () => {
    setTags(pendingTags());
    setTagInput("");
  };

  const close = () => {
    const next = pendingTags();
    const changed =
      JSON.stringify([...next].sort()) !== JSON.stringify([...(memory.tags ?? [])].sort());
    setTags(null);
    setTagInput("");
    setConfirmingDelete(false);
    onOpenChange(false);
    if (!changed) return;
    const key = `${endpoint.memories}/${memory._id}`;
    void putFetcher(key, { arg: { tags: next } }).then(
      (response) => {
        if (!response?.success) throw new Error(response?.message);
        toast.success("Story updated");
        return mutate(key);
      },
    ).catch(() => toast.error("Could not save changes"));
  };

  const share = () => {
    close();
    openModal("share-memory", { memory });
  };

  const bookmark = () => {
    toggleBookmark();
    close();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await moveMemoryToDeleted(memory._id);
      onOpenChange(false);
      navigate("/stories");
    } catch (error) {
      toast.error(memoryActionError(error, "Couldn't delete this memory. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(bottomSheetClass, "px-5 pt-5")}
      >
        <SheetDescription className="sr-only">
          Share, bookmark, set who can see, tag or delete this story.
        </SheetDescription>
        {confirmingDelete ? (
          <div className="flex flex-col items-center px-1 pb-6 pt-4">
            <SheetTitle className="sr-only">Delete this story?</SheetTitle>
            <TriangleAlert
              className="mb-6 mt-2 size-24 stroke-[var(--bg-neutral-solid)] [&_path]:[fill:var(--fill-warning-strong)]"
              strokeWidth={1.5}
              aria-hidden
            />
            <p aria-hidden className="mb-2.5 px-4 text-center font-garamond text-[22px] leading-[30px] text-text-neutral-strong">
              Delete this story?
            </p>
            <p className="mb-10 text-center font-inter text-[15px] leading-[23px] text-text-neutral-weak">
              You can restore it from Deleted for 30 days.
            </p>
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-14 flex-1 rounded-full bg-fill-neutral-weak font-inter text-base font-semibold text-text-neutral-strong"
              >
                Go back
              </button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="h-14 flex-1 rounded-full font-inter text-base font-semibold"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="pb-6">
            <div className="mb-5 flex items-center justify-between px-0.5">
              <SheetTitle className="font-garamond text-[22px] font-normal leading-7 text-text-neutral-strong">
                Actions
              </SheetTitle>
              <button
                type="button"
                aria-label="Close actions"
                onClick={close}
                className="flex size-11 items-center justify-center rounded-full bg-fill-neutral-weak text-text-neutral-weak"
              >
                <X className="size-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            <button type="button" onClick={share} className={rowClass}>
              <Share2 className="size-5 text-text-neutral-weak" strokeWidth={1.8} aria-hidden />
              Share now
            </button>
            <button type="button" onClick={bookmark} className={rowClass}>
              {memory.bookmarked ? (
                <BookmarkCheck className="size-5 text-text-neutral-weak" strokeWidth={1.8} aria-hidden />
              ) : (
                <Bookmark className="size-5 text-text-neutral-weak" strokeWidth={1.8} aria-hidden />
              )}
              {memory.bookmarked ? "Remove bookmark" : "Add bookmark"}
            </button>
            <div className="mb-4 rounded-2xl bg-fill-neutral-weak p-4">
              <ShareStoryAudience memoryId={memory._id} />
            </div>
            <div className="mb-6 flex flex-col gap-2">
              <label
                htmlFor="story-actions-tags"
                className="px-0.5 font-inter text-[15px] leading-[23px] text-text-neutral-strong"
              >
                Tags
              </label>
              <div className="flex min-h-[72px] flex-col gap-2 rounded-2xl bg-bg-neutral-solid p-3">
                {currentTags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {currentTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center rounded-full bg-fill-neutral-weak px-2.5 py-[5px] font-inter text-[13px] leading-[19px] text-text-neutral-strong"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          onClick={() => setTags(currentTags.filter((item) => item !== tag))}
                          className="ml-1 text-text-neutral-weak"
                        >
                          <X className="size-[11px]" strokeWidth={2.5} aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <input
                  id="story-actions-tags"
                  value={tagInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTagInput(value);
                    if (/[\s,]/.test(value)) {
                      const added = value.split(/[\s,]+/).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
                      setTags([...new Set([...currentTags, ...added])]);
                      setTagInput("");
                    }
                  }}
                  onBlur={addTags}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTags();
                    }
                  }}
                  placeholder="Add a tag…"
                  className="min-h-5 bg-transparent font-inter text-sm font-medium leading-5 text-text-neutral-strong outline-none placeholder:text-text-neutral-weaker"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (memory.status === "deleted") {
                  close();
                  openModal("delete-memory", { memory });
                } else setConfirmingDelete(true);
              }}
              className="h-14 w-full rounded-full bg-fill-error-weak font-inter text-base font-semibold text-text-error-strong"
            >
              Delete story
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
