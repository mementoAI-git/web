
export default function Loading() {
  return (
    <div className="px-9 py-8">
      <div className="max-w-140 space-y-5">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-45 rounded bg-gray-200" />
          <div className="h-4 w-80 rounded bg-gray-200" />
        </div>
        <div className="h-30 w-full rounded bg-gray-200" />

        <div>
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="flex flex-wrap gap-2 my-3">
            {
              [1, 2, 3, 4].map(i => <div key={i} className="w-[49%] h-33 rounded bg-gray-200" />)
            }
          </div>
        </div>

        <div className="space-y-4 my-2">
          {
            [1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-gray-200" />
                <div className="w-full h-10 rounded bg-gray-200" />
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}