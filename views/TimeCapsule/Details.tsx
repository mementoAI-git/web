"use client"

import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import { useRouter } from "next/navigation";
import { ICapsule } from "@/utility/interface";
import { isEmpty } from "@/utility";
import { DetailsSkeleton } from "./Skeleton";
import TImesIcon from "@/public/icon/times.svg"
import FileAttachment from "@/components/FileAttachment";

export default function CapsuleDetails({ data }: { data: ICapsule }) {
  const router = useRouter()
  if (isEmpty(data)) return <DetailsSkeleton />
  return (
    <div className="space-y-3">
      <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
        <ChevronLeftIcon width={10} height={10} />
        <span className="font-inter text-sm text-grey-600">Back</span>
      </button>
      <span className="font-bricolage capitalize text-4xl font-medium text-[#101828]">
        {data?.title}
      </span>
      <div className="flex items-center mt-6 gap-3">
        <span className="text-[#667085] text-xs font-inter">To (recipients):</span>
        <div className="flex flex-wrap gap-2">
          {data?.recipients.map((r, i) => (
            <span
              key={i}
              className="mem-tags w-fit flex gap-2 items-center !lowercase !font-normal !text-grey-600"
            >
              <span className="block max-w-40 truncate whitespace-nowrap">
                {r.email}
              </span>
              <TImesIcon width={7} />
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t border-grey-500" />
      <div className="font-inter text-sm text-grey-600">
        <span>{data?.body}</span>
      </div>
      {/* <div className="flex flex-wrap gap-2">
        {
          data.attachments.map((a, i) => (
            <FileAttachment
              key={i}
              progressType="text"
              file={{ file: null, progress: 100, uploadedFile: a }}
            />
          ))
        }
      </div> */}
    </div>
  );
}
