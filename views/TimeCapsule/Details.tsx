"use client"

import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import { useRouter } from "next/navigation";
import { ICapsule } from "@/utility/interface";
import { isEmpty } from "@/utility";
import { DetailsSkeleton } from "./Skeleton";

export default function CapsuleDetails({ data }: { data: ICapsule }) {
  const router = useRouter()
  if (isEmpty(data)) return <DetailsSkeleton />
  return (
    <div className="space-y-3">
      <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
        <ChevronLeftIcon width={10} height={10} />
        <span className="font-inter text-sm text-grey-600">Back</span>
      </button>
      <span className="font-bricolage text-4xl font-medium text-[#101828]">
        {data?.title}
      </span>
      <span></span>
      <div className="mt-3 border-t border-grey-500" />
      <div className="font-inter text-sm text-grey-600">
        <span>{data?.body}</span>
      </div>
    </div>
  );
}
