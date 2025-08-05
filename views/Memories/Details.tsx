"use client"

import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import { useRouter } from "next/navigation";
import { IMemory } from "@/utility/interface";
import FileGallery from "@/components/FileGallery";
import { isEmpty } from "@/utility";
import { DetailsSkeleton } from "./Skeleton";

export default function MemoryDetails({ memory }: { memory: IMemory }) {
  const router = useRouter()
  if (isEmpty(memory)) return <DetailsSkeleton />
  return (
    <div className="flex flex-1 gap-2 sm:gap-3 flex-col px-4 sm:px-6 lg:px-8">
      <div className="pb-2 sm:pb-3 space-y-2 sm:space-y-3 border-b border-grey-500">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-2 py-1 sm:px-3 sm:py-1.5 text-black hover:bg-grey-300 transition-colors"
        >
          <ChevronLeftIcon width={10} height={10} />
          <span className="font-inter text-xs sm:text-sm text-grey-600">Back</span>
        </button>
        <span className="font-bricolage text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-[#101828] leading-tight">
          {memory?.title}
        </span>
      </div>
      <div className="flex-1 h-full overflow-y-auto pb-4 sm:pb-6">
        <FileGallery files={memory?.attachments || []} />
        <div className="font-inter text-sm sm:text-base text-grey-600 mt-4 sm:mt-6 leading-relaxed">
          <span>{memory?.body}</span>
        </div>
      </div>
    </div>
  );
}
