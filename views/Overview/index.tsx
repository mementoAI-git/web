"use client";

import Streak from "./Streak";
import DailyPrompt from "./DailyPrompt";
import Topics from "./Topics";
import StartConversation from "./StartConversation";
import RecentActivities from "./RecentActivities";
import useSWR from "swr";
import endpoint from "@/api/endpoint";

export default function Overview() {
  const { data, isLoading } = useSWR(endpoint.prompts);

  return (
    <div className="size-full overflow-y-auto hide-scrollbar">
      <div className="py-8 space-y-3">
        <div className="text-4xl text-secondary font-bricolage font-medium leading-11 capitalize">
          Overview
        </div>
        <div className="flex items-stretch gap-3">
          <StartConversation />
          <Streak />
        </div>
      </div>

      <div className="py-8">
        <span className="font-inter text-lg font-semibold text-grey-900">
          Today’s memory prompts
          <span className="text-grey-800"> 0/{data?.data?.length || 0}</span>
        </span>
        <div className="mt-2 flex items-stretch gap-3">
          <div className="flex flex-1 flex-col gap-10">
            {isLoading ? (
              <div className="flex animate-pulse flex-wrap items-stretch gap-3">
                <div className="h-72.5 w-1/2 max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
                <div className="h-72.5 w-1/2 max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
              </div>
            ) : (
              <div className="flex flex-wrap items-stretch gap-3">
                {data?.data?.map((item, i) => (
                  <DailyPrompt key={i} {...item} />
                ))}
              </div>
            )}
            <Topics />
          </div>

          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
