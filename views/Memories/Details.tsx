"use client"

import LunchIcon from "@/public/icon/lauch.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import RemoveBookmarkIcon from "@/public/icon/bookmark-solid.svg"
import { useRouter } from "next/navigation";
import { IMemory } from "@/utility/interface";
import FileGallery from "@/components/FileGallery";
import { isEmpty } from "@/utility";
import { DetailsSkeleton } from "./Skeleton";
import DOMPurify from "isomorphic-dompurify";
import React, { useState } from "react";
import { useBookmark } from "@/hooks/use-bookmark";
import SidebarDetails from "../../components/Memory/SidebarDetails";
import { MemoryDropdown } from "../Chat/Conversation/Dropdown";
import { useModal } from "@/hooks/use-modal";

export default function MemoryDetails({ memory }: { memory: IMemory }) {
  const [isOpen, setIsOpen] = useState(true)
  const { open } = useModal()
  const { toggleBookmark } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: memory?.bookmarked
  });

  if (isEmpty(memory)) return <DetailsSkeleton />
  return (
    <React.Fragment>
      <div className="h-full mx-auto px-5 max-w-[758px] w-full py-6 overflow-y-auto hide-scrollbar">
        <div className="flex flex-1 gap-2 sm:gap-3 flex-col h-full">
          <div className="pb-2 sm:pb-3 space-y-2 sm:space-y-3 border-b border-grey-500">

            <div className="flex gap-1 items-center text-sand-12 mb-3.5">
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2"
                onClick={() => open("share-post", memory?._id)}
              >
                <LunchIcon className="stroke-[1.5px] size-full text-sand-12 cursor-pointer" />
              </div>
              <div
                className="text-sand-12 flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2" onClick={toggleBookmark}>
                {
                  memory.bookmarked ?
                    <RemoveBookmarkIcon className="text-sand-8 size-full stroke-2 cursor-pointer" /> :
                    <BookmarkIcon className="text-sand-12  size-full stroke-2 cursor-pointer" />
                }
              </div>
              <MemoryDropdown {...{ memory, onViewDetails: () => setIsOpen(prev => !prev) }} />
            </div>

            <span className="font-garamond text-xl sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px] font-medium text-[#101828] leading-tight">
              {memory?.title}
            </span>
          </div>
          <div className="flex-1 h-full pb-4 sm:pb-6">
            <FileGallery files={memory?.attachments || []} />
            <div className="tiptap-editor">
              <div
                className="font-inter text-sm sm:text-base text-grey-600 mt-4 sm:mt-6 leading-relaxed tiptap-editor"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(memory?.body || "") }}
              />
            </div>
          </div>
        </div>
        <div className="h-110" />
      </div>
      {
        isOpen && (
          <SidebarDetails {...{
            memory,
            onClose: () => setIsOpen(false),
            isOpen
          }}
          />
        )
      }

    </React.Fragment>
  );
}
