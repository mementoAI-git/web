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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { MemoryDropdown } from "@/pages/dashboard/chat/conversation/dropdown";
import SidebarDetails from "@/components/memory/sidebar-details";
import FileGallery from "@/components/file-gallery";
import DOMPurify from "isomorphic-dompurify";
import { DetailsSkeleton } from "./components/skeleton";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";

function getTopicColor(topic: string) {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsla(${hue}, 85%, 97%, 0.8)`,
    border: `hsla(${hue}, 60%, 88%, 0.9)`,
    text: `hsl(${hue}, 65%, 28%)`,
  };
}

export default function MobileStoryDetails() {
  const { id } = useParams();
  const router = useNavigate();
  const { user, setHeaderTitle } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const { open } = useModal();
  const { data, error, isLoading } = useSWR(
    id ? `${endpoint.memories}/${id}` : null,
  );
  const memory = data?.data as IMemory;

  const { toggleBookmark } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: memory?.bookmarked,
  });

  useEffect(() => {
    setHeaderTitle(memory?.title || "New memory");
    return () => {
      setHeaderTitle(null);
    };
  }, [memory?.title, setHeaderTitle]);

  useEffect(() => {
    if (error && isEmpty(data) && !isLoading) {
      router("/stories");
    }
  }, [error, data, router, isLoading]);

  // Track when memory is opened
  useEffect(() => {
    if (data?.data && !isLoading) {
      addToRecentMemories(data.data, user?.email);
    }
  }, [data?.data, user?.email, isLoading]);

  if (isEmpty(memory)) return <DetailsSkeleton />;
  return (
    <div className="flex max-w-[1160px] mx-auto h-screen">
      <div className="h-full mx-auto px-5 max-w-[758px] w-full py-6 overflow-y-auto hide-scrollbar">
        <div className="flex flex-1 gap-2 sm:gap-3 flex-col h-full">
          <div className="pb-2 sm:pb-3 space-y-2 sm:space-y-3 border-b border-stroke-neutral-weaker">
            <div className="flex gap-1 items-center text-text-neutral-strong mb-3.5">
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-fill-neutral-weaker"
                onClick={() => open("share-memory", { memory })}
              >
                <Launch2Icon className="stroke-[1.5px] size-full text-text-neutral-strong cursor-pointer" />
              </div>
              <div
                className="text-text-neutral-strong flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-fill-neutral-weaker"
                onClick={toggleBookmark}
              >
                {memory.bookmarked ? (
                  <BookmarkSolidIcon className="text-icon-neutral-weaker size-full stroke-2 cursor-pointer" />
                ) : (
                  <BookmarkIcon className="text-text-neutral-strong size-full stroke-2 cursor-pointer" />
                )}
              </div>
              <MemoryDropdown
                {...{ memory, onViewDetails: () => setIsOpen((prev) => !prev) }}
              />
            </div>

            <TypographyH1 className="font-garamond text-xl font-medium leading-tight text-text-neutral-strong sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px]">
              {memory?.title}
            </TypographyH1>
          </div>
          <div className="flex-1 h-full pb-4 sm:pb-6">
            {memory.summary?.trim() || (Array.isArray(memory.topics) && memory.topics.length > 0) ? (
              <div className="mb-6 space-y-4 rounded-2xl bg-fill-neutral-weakest/50 border border-stroke-neutral-weaker/40 p-5 backdrop-blur-sm shadow-sm">
                {memory.summary?.trim() ? (
                  <div className="border-l-4 border-stroke-brand-strong pl-4">
                    <p className="font-georgia italic text-base sm:text-lg leading-relaxed text-text-neutral-strong">
                      "{memory.summary.trim()}"
                    </p>
                  </div>
                ) : null}

                {Array.isArray(memory.topics) && memory.topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {memory.topics.map((topic) => {
                      const colors = getTopicColor(topic);
                      return (
                        <span
                          key={topic}
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                          className="inline-flex items-center rounded-full border px-3 py-1 font-inter text-xs font-semibold transition-colors"
                        >
                          #{topic}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isEmpty(memory?.attachments) && (
              <FileGallery files={memory?.attachments || []} />
            )}
            <div className="tiptap-editor">
              <TypographyMuted
                className="tiptap-editor mt-4 font-inter text-sm leading-relaxed text-text-neutral-weak sm:mt-6 sm:text-base"
                dangerouslySetInnerHTML={{
                  __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(memory?.body || "")),
                }}
              />
            </div>
          </div>
        </div>
        <div className="h-110" />
      </div>
      {isOpen && (
        <SidebarDetails
          {...{
            memory,
            onClose: () => setIsOpen(false),
            isOpen,
            source: "story",
          }}
        />
      )}
    </div>
  );
}
