import { ReactNode } from "react"

interface IStatsCard {
  title: string
  value: string
  icon: ReactNode
}
export default function StatsCard({ title, value, icon }: IStatsCard) {
  return (
    <div className="flex grow gap-2.5 max-w-1/2 items-start border border-grey-500 rounded-xl p-6">
      <span className="text-grey-600">{icon}</span>
      <div className="flex flex-col gap-2 font-inter">
        <span className="text-[#000626E5] font-medium">{value}</span>
        <span className="text-[#000933A6]">{title}</span>
      </div>
    </div>
  )
}