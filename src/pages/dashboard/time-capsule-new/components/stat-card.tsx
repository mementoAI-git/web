import React from "react";

interface IStatCard {
  icon: React.ReactElement;
  title: string;
  message?: string;
  bgImage?: string;
}

export function StatCard({ title, icon, message, bgImage }: IStatCard) {
  return (
    <div className="flex flex-1 relative max-h37 border border-gray-200 justify-between overflow-hidden gap-3 rounded-2xl px-6 md:px-10 lg:px-4 py-5 md:py-6">
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}

      <div className="flex flex-col gap-4 flex-1 z-10">
        <span className="font-inter text-gray-500 leading-[18px] font-normal uppercase">
          {title}
        </span>
        <span className="text-gray-400">{message}</span>
      </div>
      <span className="text-gray-400 z-10">{icon}</span>
    </div>
  );
}
