export default function Loader() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
      <div className="hide-scrollbar flex h-full min-h-0 w-full min-w-0 max-w-[800px] flex-col overflow-y-auto">
        <div className="w-full max-w-full flex-1">
          <div className="py-12 space-y-6">
            {/* Loading Header */}
            <div className="animate-pulse">
              <div className="h-8 bg-sand-3 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-sand-3 rounded w-1/2"></div>
            </div>
          </div>
          <div className="px-5 space-y-6">
            {/* Loading Bubbles */}
            <div className="animate-pulse">
              <div className="h-16 bg-sand-3 rounded-lg mb-4"></div>
              <div className="h-16 bg-sand-3 rounded-lg mb-4 ml-[30%]"></div>
              <div className="h-16 bg-sand-3 rounded-lg mb-4"></div>
              <div className="h-16 bg-sand-3 rounded-lg mb-4 ml-[30%]"></div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white px-0 pb-4 sm:px-3 md:px-5">
          <div className="w-full">
            <div className="animate-pulse">
              <div className="h-52 bg-sand-3 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}