"use client"

import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import { useRouter } from "next/navigation";
import { IMemory } from "@/utility/interface";
import FileGallery from "@/components/FileGallery";
import { isEmpty } from "@/utility";
import { DetailsSkeleton } from "./Skeleton";
import DOMPurify from "isomorphic-dompurify";
import React, { useState } from "react";
import SidebarDetails from "../../components/Memory/SidebarDetails";

export default function MemoryDetails({ memory }: { memory: IMemory }) {
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()
  if (isEmpty(memory)) return <DetailsSkeleton />
  return (
    <React.Fragment>
      <div className="h-full mx-auto px-5 max-w-[758px] w-full py-6 overflow-y-auto hide-scrollbar">
        <div className="flex flex-1 gap-2 sm:gap-3 flex-col h-full">
          <div className="pb-2 sm:pb-3 space-y-2 sm:space-y-3 border-b border-grey-500">
            <button
              onClick={() => router.back()}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-2 py-1 sm:px-3 sm:py-1.5 text-black hover:bg-grey-300 transition-colors"
            >
              <ChevronLeftIcon width={10} height={10} />
              <span className="font-inter text-xs sm:text-sm text-grey-600">Back</span>
            </button>
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
