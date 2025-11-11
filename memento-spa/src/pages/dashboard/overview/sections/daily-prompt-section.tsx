import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import folderIcon from "@/assets/image/folder.png";
import type { IPrompt } from "@/utility/interface";

interface PromptResponse {
  data?: Array<{ prompt: IPrompt }>;
}

function DailyPrompt({ title, _id }: IPrompt) {
  return (
    <Link
      to={`/chat/reply/${_id}`}
      className="flex min-h-[260px] flex-col justify-between gap-6 rounded-2xl border border-black/10 bg-white p-6 transition hover:shadow-lg sm:min-h-[333.5px] md:p-8"
    >
      <img
        src={folderIcon}
        alt="Folder icon"
        className="h-[41.28px] w-[44.26px] object-cover"
        loading="lazy"
      />
      <div className="space-y-3">
        <span className="hidden w-fit items-center gap-[6px] rounded-full border-[1.5px] border-black/10 px-[10px] py-[2px] font-inter text-xs font-medium text-gray-500 md:inline-flex">
          Question
        </span>
        <p className="font-garamond text-xl font-medium text-gray-800">{title}</p>
      </div>
    </Link>
  );
}

function DailyPromptSkeleton() {
  return (
    <div className="flex min-h-[260px] flex-col justify-between gap-6 rounded-2xl border border-sand-4 bg-sand-1 p-8 animate-pulse sm:min-h-[333.5px]">
      <div className="h-16 w-16 rounded bg-sand-3" />
      <div className="space-y-3">
        <div className="h-6 w-20 rounded-full bg-sand-3" />
        <div className="space-y-2">
          <div className="h-6 w-full rounded bg-sand-3" />
          <div className="h-6 w-3/4 rounded bg-sand-3" />
        </div>
      </div>
    </div>
  );
}

export default function DailyPromptSection() {
  const { data, isLoading } = useSWR<PromptResponse>(endpoint.prompts);

  if (isLoading) {
    return (
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <DailyPromptSkeleton key={`prompt-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
      {data?.data?.length
        ? data.data.map(({ prompt }, index) => (
            <DailyPrompt key={prompt._id ?? index} {...prompt} />
          ))
        : null}
    </div>
  );
}

