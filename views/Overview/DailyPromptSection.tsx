import questionIcon from "@/public/image/question-2.png"
import Image from "next/image"
import { IPrompt } from "@/utility/interface";
import Link from "next/link";
import useSWR from "swr";
import endpoint from "@/api/endpoint";

function DailyPrompt({ title, _id }: IPrompt) {
  return (
    <Link href={`/chat/reply/${_id}`} className="border gap-9 border-sand-4 flex justify-between flex-col bg-sand-2 md:bg-sand-1 p-6 md:p-8 rounded-2xl">
      <Image src={questionIcon} alt="Question icon" width={64} className="size-10 sm:size-13 lg:w-16" />
      <div className="space-y-3">
        <span className="rounded-full hidden cursor-pointer gap-[6px] md:inline-flex items-center text-xs border-[1.5px] text-gray-700 border-gray-900 px-3 py-1">
          Question
        </span>
        <p className="font-georgia text-xl text-sand-12">
          {title}
        </p>
      </div>
    </Link>
  )
}

function DailyPromptSkeleton() {
  return (
    <div className="border gap-9 border-sand-4 flex justify-between flex-col bg-sand-1 p-8 rounded-2xl animate-pulse">
      <div className="w-16 h-16 bg-sand-3 rounded" />
      <div className="space-y-3">
        <div className="w-20 h-6 bg-sand-3 rounded-full" />
        <div className="space-y-2">
          <div className="w-full h-6 bg-sand-3 rounded" />
          <div className="w-3/4 h-6 bg-sand-3 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function DailyPromptSection() {
  const { data, isLoading } = useSWR(endpoint.prompts);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
      {
        isLoading ?
          Array.from({ length: 2 }, (_, i) => (
            <DailyPromptSkeleton key={`skeleton-${i}`} />
          )) : data?.data?.length > 0 &&
          data.data.map((p, i) => <DailyPrompt {...p?.prompt} key={i} />)
      }
    </div>
  )
}