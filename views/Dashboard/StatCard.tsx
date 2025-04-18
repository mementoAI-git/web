import React from "react";

interface IStatCard {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
}

export function StatCard({ title, icon, subtitle }: IStatCard) {
  return (
    <div className="flex max-h-37 flex-1 flex-col gap-3 rounded-2xl bg-[#F9F9F9] px-10 py-6">
      <span className="text-[#949494]">{icon}</span>
      <div className="flex flex-col gap-1">
        <span className="font-bricolage text-2xl font-medium text-[#050709]">
          {title}
        </span>
        <span className="font-inter text-[#475467]">{subtitle}</span>
      </div>
    </div>
  );
}
