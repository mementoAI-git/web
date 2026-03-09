import endpoint from "@/api/endpoint";
import {
  BookmarkIcon,
  Launch2Icon,
  BookmarkSolidIcon,
} from "@/components/icons";
import { useBookmark } from "@/hooks/use-bookmark";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { addToRecentMemories, ensureLinksOpenInNewTab, isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useEffect } from "react";
import useSWR from "swr";
import { MemoryDropdown } from "@/pages/dashboard/chat/conversation/dropdown";
import FileGallery from "@/components/file-gallery";
import DOMPurify from "isomorphic-dompurify";

/** Converts plain text to HTML with paragraphs for display when body has no HTML structure */
function ensureHtmlFormat(body: string): string {
  const trimmed = (body || "").trim();
  if (!trimmed) return "";
  // If it already contains HTML tags, return as-is (after sanitization)
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  // Plain text: wrap in paragraphs, preserving line breaks
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

interface ViewMemoryProps {
  data: { memoryId?: string; memory?: IMemory };
  isMobile?: boolean;
}

export function ViewMemory({ data, isMobile }: ViewMemoryProps) {
  const { close, push } = useModal();
  const { user } = useStore();

  const memoryId = data.memoryId || data.memory?._id;
  const { data: fetched, isLoading } = useSWR(
    memoryId ? `${endpoint.memories}/${memoryId}` : null,
  );
  const memory = (fetched?.data as IMemory) || data.memory;

  const { toggleBookmark } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: memory?.bookmarked,
  });

  useEffect(() => {
    if (memory && !isLoading) {
      addToRecentMemories(memory, user?.email);
    }
  }, [memory, user?.email, isLoading]);

  if (isMobile) return null;

  const loading = !memory && isLoading;

  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-full max-w-[572px] bg-white flex flex-col shadow-2xl rounded-[24px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
        <h2 className="font-garamond text-2xl font-medium text-gray-900 truncate pr-4">
          {loading ? "" : memory?.title || "Story"}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="aspect-square flex justify-center items-center p-1.5 size-8 rounded-lg hover:bg-sand-2 cursor-pointer"
            onClick={() => memory && push("share-memory", { memory })}
          >
            <Launch2Icon className="stroke-[1.5px] size-full text-sand-12" />
          </div>
          <div
            className="flex justify-center items-center p-1.5 aspect-square size-8 rounded-lg hover:bg-sand-2 cursor-pointer"
            onClick={() => memory && toggleBookmark()}
          >
            {memory?.bookmarked ? (
              <BookmarkSolidIcon className="text-sand-8 size-full stroke-2" />
            ) : (
              <BookmarkIcon className="text-sand-12 size-full stroke-2" />
            )}
          </div>
          {memory && <MemoryDropdown memory={memory} />}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5">
        {loading ? (
          <ViewMemorySkeleton />
        ) : (
          <>
            {!isEmpty(memory?.attachments) && (
              <FileGallery files={memory?.attachments || []} />
            )}
            <div
              className="tiptap-editor prose prose-sm max-w-none text-gray-800 mt-4 leading-relaxed font-garamond"
              dangerouslySetInnerHTML={{
                __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(ensureHtmlFormat(memory?.body || ""))),
              }}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => memory && close("view-memory")}
          className="font-inter text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            if (memory) {
              push("edit-memory", { memory });
            }
          }}
          className="font-inter text-sm font-medium text-orange hover:text-[#C55A1D] transition-colors"
        >
          Edit Story
        </button>
      </div>
    </div>
  );
}

function ViewMemorySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-sand-3 rounded-xl" />
      <div className="space-y-2">
        <div className="h-3 bg-sand-3 rounded w-full" />
        <div className="h-3 bg-sand-3 rounded w-4/5" />
        <div className="h-3 bg-sand-3 rounded w-3/5" />
      </div>
      <div className="space-y-2 mt-6">
        <div className="h-3 bg-sand-3 rounded w-full" />
        <div className="h-3 bg-sand-3 rounded w-5/6" />
        <div className="h-3 bg-sand-3 rounded w-2/3" />
      </div>
    </div>
  );
}
