import { ReactNode } from "react"

interface IStatsCard {
  title: string
  value: string
  icon: ReactNode
}
export default function StatsCard({ title, value, icon }: IStatsCard) {
  return (
    <div className="flex grow gap-2 sm:gap-2.5 max-w-full sm:max-w-1/2 items-start border border-grey-500 rounded-xl p-4 sm:p-6">
      <span className="text-grey-600 text-lg sm:text-xl">{icon}</span>
      <div className="flex flex-col gap-1 sm:gap-2 font-inter">
        <span className="text-[#000626E5] font-medium text-lg sm:text-xl lg:text-2xl">{value}</span>
        <span className="text-[#000933A6] text-sm sm:text-base">{title}</span>
      </div>
    </div>
  )
}