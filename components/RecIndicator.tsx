

export default function RecIndicator({ className = "" }) {
  return (
    <div className={`flex flex-1 gap-1 rounded-full bg-grey-400 py-1.5 px-2 text-grey-600 ${className}`}>
      <div className="bg-white flex items-center justify-center rounded-full aspect-square w-5">
        <div className="bg-[#F97066] w-[7px] aspect-square rounded-full" />
      </div>
      <span className="font-inter text-sm font-medium">00:00:00</span>
    </div>
  )
}