
export default function Loading() {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-3">
        <div className="w-[50%] h-7 rounded bg-gray-200" />
        <div className="w-full bg-gray-200 h-20 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-50 bg-gray-200 w-61.5 shrink-0  rounded" />
        <div className="h-50 bg-gray-200 min-w-94 rounded" />
        <div className="h-50 bg-gray-200 w-61.5 shrink-0 rounded" />
        <div className="h-50 bg-gray-200 min-w-94 rounded" />
        <div className="h-50 bg-gray-200 w-61.5 shrink-0 rounded" />
        <div className="h-50 bg-gray-200 w-61.5 shrink-0 rounded" />
      </div>
      <div className="bg-gray-200 w-full h-100 rounded"></div>
    </div>
  )
}