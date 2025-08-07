
export default function Loading() {
  return (
    <div className="mx-auto w-[95%] sm:w-[93%] animate-pulse">
      <div className="w-full pt-4 sm:pt-6 lg:pt-8">
        <span className="h-4 sm:h-5 w-32 sm:w-40 lg:w-45 inline-block rounded bg-gray-200" />
        <div className="flex flex-col sm:flex-row items-stretch gap-3 pb-4 sm:pb-6 lg:pb-8">
          <div className="flex flex-1 rounded-2xl min-h-40 sm:min-h-50 lg:min-h-60 bg-gray-200" />
          <div className="w-full sm:max-w-[335px] flex-1 rounded-2xl bg-gray-200" />
        </div>
        <div className="py-4 sm:py-6 lg:py-8">
          <div className="mt-2 flex flex-col lg:flex-row items-stretch gap-3">
            <div className="flex flex-1 flex-col gap-6 sm:gap-8 lg:gap-10">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="h-48 sm:h-56 lg:h-72.5 w-full sm:w-1/2 max-w-full sm:max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
                <div className="h-48 sm:h-56 lg:h-72.5 w-full sm:w-1/2 max-w-full sm:max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
              </div>
            </div>
            <div className="w-full lg:max-w-[335px] rounded-2xl bg-gray-200 h-48 sm:h-56 lg:h-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}