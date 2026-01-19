import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import folderIcon from "@/assets/image/folder.png";
import type { IPromptWithAnswer } from "@/utility/interface";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { cn } from "@/utility";
import { CircleCheckIcon } from "@/components/icons";

function DailyPrompt({ title, _id, answered }: IPromptWithAnswer) {
  const CardContent = () => (
    <>
      <img
        src={folderIcon}
        alt="Question icon"
        className="w-[44.26px] h-[41.28px] object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />
      <div className="flex flex-col relative">
        <span
          className={cn(
            "rounded-full w-fit hidden cursor-pointer gap-1.5 md:inline-flex items-center font-inter font-medium text-xs border-[1.5px] text-gray-500 border-black/10 px-[10px] py-[2px] mb-3 transition-all duration-300 ease-out",
            !answered &&
              "group-hover:opacity-0 group-hover:invisible group-hover:h-0 group-hover:mb-0",
          )}
        >
          Question
        </span>
        <p className="font-garamond font-medium text-xl text-gray-800 mb-3 transition-all duration-300 ease-out group-hover:text-gray-900">
          {title}
        </p>
        {answered ? (
          <span className="flex font-inter items-center gap-2 whitespace-nowrap text-base text-accent-green-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <CircleCheckIcon className="size-6 transition-transform duration-300 ease-out group-hover:scale-110" />
            Replied
          </span>
        ) : (
          <Link
            to={`/chat/reply/${_id}`}
            className={cn(
              "btn w-fit md:bg-blue-6! text-sm! md:text-base! px-4! sm:px-5! py-1.5! sm:py-2.5!",
              "absolute left-0 bottom-0 opacity-0 translate-y-full pointer-events-none",
              "sm:group-hover:relative sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:pointer-events-auto",
              "transition-all duration-300 ease-out",
            )}
          >
            <span className="whitespace-nowrap">Reply</span>
            <ArrowRightIcon className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </>
  );
  return (
    <Link
      to={`/chat/reply/${_id}`}
      className="border sm:min-h-[333.5px] border-black/10 flex gap-10 justify-between flex-col bg-white p-6 md:p-8 rounded-2xl group transition-all duration-300 ease-out hover:shadow-sm hover:border-black/20 active:scale-[0.98] overflow-hidden"
    >
      <CardContent />
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
      {isLoading
        ? Array.from({ length: 2 }, (_, i) => (
            <DailyPromptSkeleton key={`skeleton-${i}`} />
          ))
        : data?.data?.length > 0 &&
          data.data.map((p, i) => <DailyPrompt {...p?.prompt} key={i} />)}
    </div>
  );
}
