
export default function Loading() {
  return (
    <div className="mx-auto w-[93%] animate-pulse">
      <div className="w-full pt-8">
        <span className="h-5 w-45 inline-block rounded bg-gray-200" />
        <div className="flex items-stretch gap-3 pb-8">
          <div className="flex flex-1 rounded-2xl min-h-60 bg-gray-200" />
          <div className="max-w-[335px] w-full flex-1 rounded-2xl  bg-gray-200" />
        </div>
        <div className="py-8">
          <div className="mt-2 flex items-stretch gap-3">
            <div className="flex flex-1 flex-col gap-10 ">
              <div className="flex flex-wrap items-stretch gap-3">
                <div className="h-72.5 w-1/2 max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
                <div className="h-72.5 w-1/2 max-w-[368.5px] flex-1 rounded-2xl bg-gray-200" />
              </div>
            </div>
            <div className="w-full max-w-[335px] rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}