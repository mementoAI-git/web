

export default function RecIndicator({ counter = 0, recoding = false, className = "" }) {
  return (
    <div className={`flex flex-1 gap-1 rounded-full bg-grey-400 py-1.5 px-2 text-grey-600 ${className}`}>
      <div className="bg-white flex items-center justify-center rounded-full aspect-square w-5">
        <span className="relative flex size-[7px]">
          <span className={`absolute inline-flex h-full w-full ${recoding ? "animate-ping" : ""} rounded-full bg-[#F97066] opacity-75`}></span>
          <span className="relative inline-flex size-[7px] rounded-full bg-[#F97066]"></span>
        </span>
      </div>
      <span className="font-inter text-sm font-medium">
        {String(Math.floor(counter / 3600)).padStart(2, "0")}:
        {String(Math.floor((counter % 3600) / 60)).padStart(2, "0")}:
        {String(counter % 60).padStart(2, "0")}
      </span>
    </div>
  )
}