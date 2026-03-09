import endpoint from "@/api/endpoint";
import {
  BookmarkIcon,
  Launch2Icon,
  BookmarkSolidIcon,
} from "@/components/icons";
import { useBookmark } from "@/hooks/use-bookmark";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { addToRecentMemories, isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { MemoryDropdown } from "@/pages/dashboard/chat/conversation/dropdown";
import SidebarDetails from "@/components/memory/sidebar-details";
import FileGallery from "@/components/file-gallery";
import DOMPurify from "isomorphic-dompurify";
import { DetailsSkeleton } from "./components/skeleton";

export default function StoriesDetails() {
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
          <div className="pb-2 sm:pb-3 space-y-2 sm:space-y-3 border-b border-grey-500">
            <div className="flex gap-1 items-center text-sand-12 mb-3.5">
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2"
                onClick={() => open("share-memory", { memory })}
              >
                <Launch2Icon className="stroke-[1.5px] size-full text-sand-12 cursor-pointer" />
              </div>
              <div
                className="text-sand-12 flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2"
                onClick={toggleBookmark}
              >
                {memory.bookmarked ? (
                  <BookmarkSolidIcon className="text-sand-8 size-full stroke-2 cursor-pointer" />
                ) : (
                  <BookmarkIcon className="text-sand-12  size-full stroke-2 cursor-pointer" />
                )}
              </div>
              <MemoryDropdown
                {...{ memory, onViewDetails: () => setIsOpen((prev) => !prev) }}
              />
            </div>

            <span className="font-garamond text-xl sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px] font-medium text-[#101828] leading-tight">
              {memory?.title}
            </span>
          </div>
          <div className="flex-1 h-full pb-4 sm:pb-6">
            {!isEmpty(memory?.attachments) && (
              <FileGallery files={memory?.attachments || []} />
            )}
            <div className="tiptap-editor">
              <div
                className="font-inter text-sm sm:text-base text-grey-600 mt-4 sm:mt-6 leading-relaxed tiptap-editor"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(memory?.body || ""),
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
