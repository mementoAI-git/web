const stength_colors = [
  "rgba(199, 58, 58, 0.8)",
  "rgba(199, 58, 58, 0.8)",
  "rgba(143, 108, 26, 0.8)",
  "rgba(143, 108, 26, 0.8)",
  "rgba(6, 122, 87, 0.8)",
  "rgba(6, 122, 87, 0.8)"
]

export default function StrengthIndicator({ level = 0 }) {
  return (
    <div>
      <span className="font-geist leading-[150%] text-grey-200 text-sm">Password strength</span>
      <div className="flex gap-1 items-center">
        {
          stength_colors
            .slice(0, Math.min(stength_colors.length, level + 1))
            .map((color, i) => <div key={i} className="max-w-[73px] flex-1 h-[12px] rounded-3xl" style={{ backgroundColor: color }} />)

        }
      </div>
    </div>
  )
}