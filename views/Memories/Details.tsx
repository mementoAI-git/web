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
    <div className="space-y-3">
      <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
        <ChevronLeftIcon width={10} height={10} />
        <span className="font-inter text-sm text-grey-600">Back</span>
      </button>
      <span className="font-bricolage text-4xl font-medium text-[#101828]">
        {memory?.title}
      </span>
      <div className="mt-3 border-t border-grey-500" />
      <FileGallery files={memory?.attachments || []} />
      <div className="font-inter text-sm text-grey-600">
        <span>{memory?.body}</span>
      </div>
    </div>
  );
}
