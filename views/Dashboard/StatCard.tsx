import React from "react"

interface IStatCard {
  icon: React.ReactElement
  title: string
  subtitle: string
}

export function StatCard({ title, icon, subtitle }: IStatCard) {
  return (
    <div className="flex flex-1 flex-col gap-3 py-6 px-10 rounded-2xl max-h-37 bg-[#F9F9F9]">
      <span className="text-[#949494]">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[#050709] font-medium text-2xl font-bricolage">{title}</span>
        <span className="text-[#475467] font-inter">{subtitle}</span>
      </div>
    </div>
  )
}