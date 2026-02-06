import React from "react";

interface IStatCard {
  icon: React.ReactElement;
  title: string;
  message?: string;
}

export function StatCard({ title, icon, message }: IStatCard) {
  return (
    <div className="flex max-h-37 flex-1 border border-gray-200 justify-between gap-3 rounded-2xl bg-sand1 px-6 md:px-10 lg:px-4 py-5 md:py-6">
      <div className="flex flex-col gap-4 flex-1">
        {/*<span className="text-gray-400">{icon}</span>*/}
        {/*<span className="font-inter text-sm text-gray-700">{subtitle}</span>*/}

        <span className="font-inter text-gray-500 leading-[18px] font-normal uppercase">
          {title}
        </span>
        <span className="text-gray-400">{message}</span>
      </div>
      <span className="text-gray-400">{icon}</span>
    </div>
  );
}
