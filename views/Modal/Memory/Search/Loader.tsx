
export function SkeletonLoader() {
  return (
    <div className="flex gap-2">
      <div className="size-20 shrink-0 bg-gray-200 rounded" />
      <div className="space-y-3 w-full">
        <div className="bg-gray-200 rounded h-4 w-[60%]" />
        <div className="bg-gray-200 rounded h-3 w-[30%]" />
        <div className="space-y-1">
          <div className="bg-gray-200 rounded h-3 w-[80%]" />
          <div className="bg-gray-200 rounded h-3 w-[70%]" />
        </div>
      </div>
    </div>
  )
}