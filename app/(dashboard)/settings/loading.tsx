
export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-9 py-4 sm:py-6 lg:py-8">
      <div className="max-w-140 space-y-3 sm:space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-1">
          <div className="h-6 sm:h-7 lg:h-8 w-32 sm:w-40 lg:w-45 rounded bg-gray-200" />
          <div className="h-3 sm:h-4 w-48 sm:w-64 lg:w-80 rounded bg-gray-200" />
        </div>
        <div className="h-20 sm:h-24 lg:h-30 w-full rounded bg-gray-200" />

        <div>
          <div className="h-2.5 sm:h-3 w-12 sm:w-16 rounded bg-gray-200" />
          <div className="flex flex-wrap gap-2 my-2 sm:my-3">
            {
              [1, 2, 3, 4].map(i => (
                <div key={i} className="w-full sm:w-[48%] lg:w-[49%] h-20 sm:h-24 lg:h-33 rounded bg-gray-200" />
              ))
            }
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 my-2">
          {
            [1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-2.5 sm:h-3 w-12 sm:w-16 rounded bg-gray-200" />
                <div className="w-full h-8 sm:h-9 lg:h-10 rounded bg-gray-200" />
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}