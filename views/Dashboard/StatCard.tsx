import React from "react";

interface IStatCard {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
}

export function StatCard({ title, icon, subtitle }: IStatCard) {
  return (
    <div className="flex max-h-37 flex-1 border border-gray-200 flex-col gap-3 rounded-2xl bg-sand-1 px-6 md:px-10 py-5 md:py-6">

      <div className="flex flex-row gap-3 items-center">
        <span className="text-gray-400">{icon}</span>

        <span className="font-canela text-2xl font-medium text-gray-800">
          {title}
        </span>
      </div>
      <span className="font-inter text-sm text-gray-700">{subtitle}</span>
    </div>
  );
}
