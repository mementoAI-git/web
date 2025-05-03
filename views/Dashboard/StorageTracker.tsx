
export default function StorageTracker() {
  return (
    <div className="w-full max-w-62 group-[.close]:hidden flex flex-col gap-4 text-sm font-inter leading-5 rounded-lg bg-grey-800 py-5 px-4">
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-white">Storage space</span>
        <span className="text-grey-500">You’re at 80% of your free storage plan. </span>
      </div>
      <div className="w-full rounded-full h-2 bg-grey-600">
        <div className="w-1/2 rounded-full bg-grey-500 h-full" />
      </div>
      <div className="flex items-center gap-3 font-semibold">
        <span className="text-[#C7C9C8] cursor-pointer">Dismiss</span>
        <span className="text-white cursor-pointer">Upgrade Plan</span>
      </div>
    </div>
  )
}