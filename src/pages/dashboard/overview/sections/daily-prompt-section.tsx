import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import folderIcon from "@/assets/image/folder.png";
import type { IPrompt } from "@/utility/interface"

function DailyPrompt({ title, _id }: IPrompt) {
  return (
    <Link to={`/chat/reply/${_id}`} className="border sm:min-h-[333.5px] border-black/10 flex gap-10 justify-between flex-col bg-white p-6 md:p-8 rounded-2xl">
      <img
        src={folderIcon}
        alt="Question icon"
        className="w-[44.26px] h-[41.28px] object-cover"
      />
      <div className="space-y-3">
        <span className="rounded-full hidden cursor-pointer gap-[6px] md:inline-flex items-center font-inter font-medium text-xs border-[1.5px] text-gray-500 border-black/10 px-[10px] py-[2px]">
          Question
        </span>
        <p className="font-garamond font-medium text-xl text-gray-800">
          {title}
        </p>
      </div>
    </Link>
  );
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
  );
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

