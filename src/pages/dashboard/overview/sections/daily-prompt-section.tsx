import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import folderIcon from "@/assets/image/folder.png";
import type { IPromptWithAnswer } from "@/utility/interface";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { CircleCheckIcon } from "@/components/icons";
import { cn } from "@/utility";

function DailyPrompt({ title, _id, answered }: IPromptWithAnswer) {
  const CardContent = () => (
    <>
      <img
        src={folderIcon}
        alt="Question icon"
        className="w-[44.26px] h-[41.28px] object-cover transition-transform duration-200 ease-out group-hover:scale-105"
      />
      <div className="space-y-3">
        <span className="rounded-full hidden cursor-pointer gap-1.5 md:inline-flex items-center font-inter font-medium text-xs border-[1.5px] text-gray-500 border-black/10 px-[10px] py-[2px] transition-colors duration-150 ease-out hover:border-gray-400 hover:text-gray-700">
          Question
        </span>
        <p className="font-garamond font-medium text-xl text-gray-800 transition-colors duration-150 ease-out group-hover:text-gray-900">
          {title}
        </p>
        {answered ? (
          <span className="flex font-inter items-center gap-2 whitespace-nowrap text-base text-accent-green-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <CircleCheckIcon className="size-6 transition-transform duration-200 ease-out group-hover:scale-110" />
            Replied
          </span>
        ) : (
          <Link
            to={`/chat/reply/${_id}`}
            className={cn(
              "btn w-fit md:bg-blue-6! text-sm! md:text-base! px-4! sm:px-5! py-1.5! sm:py-2.5!",
              "transition-all duration-200 ease-out",
              "sm:opacity-0 sm:translate-y-1",
              "sm:group-hover:opacity-100 sm:group-hover:translate-y-0",
              "sm:hidden! sm:group-hover:flex!",
            )}
          >
            <span className="whitespace-nowrap">Reply</span>
            <ArrowRightIcon className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </>
  );

  return (
    <Link
      to={`/chat/reply/${_id}`}
      className="border sm:min-h-[333.5px] border-black/10 flex gap-10 justify-between flex-col bg-white p-6 md:p-8 rounded-2xl group transition-all duration-200 ease-out hover:shadow-sm hover:border-black/20 active:scale-[0.98]"
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
          data.data.map((p, i) => (
            <DailyPrompt {...p?.prompt} answered={p.answered} key={i} />
          ))}
    </div>
  );
}
