import { useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { IPromptWithAnswer } from "@/utility/interface";
import { MicIcon } from "@/components/icons";
import { cn } from "@/utility";

function DailyPromptSkeleton() {
  return (
    <div className="rounded-2xl bg-v3-fill-weak p-5 shadow-sm animate-pulse h-full">
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-24 rounded-full bg-v3-fill-weak" />
        <div className="h-9 w-24 rounded-full bg-v3-fill-weak" />
      </div>
      <div className="space-y-3 mb-8">
        <div className="h-6 w-full rounded bg-v3-fill-weak" />
        <div className="h-6 w-3/4 rounded bg-v3-fill-weak mx-auto" />
      </div>
      <div className="flex gap-2 justify-center">
        <div className="h-10 w-32 rounded-full bg-v3-fill-weak" />
        <div className="h-10 w-24 rounded-full bg-v3-fill-weak" />
      </div>
    </div>
  );
}

export default function DailyPromptSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, isLoading } = useSWR(endpoint.prompts);

  const prompts = (data?.data ?? [])
    .map((p: { prompt?: IPromptWithAnswer }) => p?.prompt)
    .filter(Boolean) as IPromptWithAnswer[];

  if (isLoading) {
    return <DailyPromptSkeleton />;
  }

  if (prompts.length === 0) {
    return null;
  }

  const activePrompt = prompts[activeIndex];
  const hasMultiple = prompts.length > 1;

  return (
    <div className="rounded-2xl bg-v3-fill-weak p-5 shadow-sm flex flex-col gap-6 h-full">
      {/* Prompt tabs */}
      {hasMultiple && (
        <div className="flex gap-2 justify-start">
          {prompts.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "rounded-full px-2 py-1 font-inter font-medium text-[12px] transition-colors",
                i === activeIndex
                  ? "bg-v3-fill-strong text-white"
                  : "bg-v3-fill-weak text-v3-text-strong border border-v3-stroke-weak",
              )}
            >
              Prompt {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Prompt text */}
      <p className="font-inter text-[20px] font-medium text-v3-text-strong text-left leading-relaxed flex-1 flex flex-wrap">
        {activePrompt.title}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-start items-start">
        <Link
          to={`/chat/reply/${activePrompt._id}`}
          className="flex items-center h-10 px-5 rounded-full font-inter font-semibold text-sm text-v3-text-strong whitespace-nowrap transition-opacity hover:opacity-90 bg-white border border-v3-stroke-weak"
        >
          Write a response
        </Link>
        <Link
          to={`/chat/reply/${activePrompt._id}`}
          className="flex items-center gap-2 h-10 px-5 rounded-full font-inter font-semibold text-sm text-white whitespace-nowrap transition-opacity hover:opacity-90 bg-orange"
        >
          <MicIcon className="size-4" />
          Speak it
        </Link>
      </div>
    </div>
  );
}
