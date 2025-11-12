export default function Loader() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container flex-1">
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
      <div className="sticky bottom-0 pb-4 bg-background">
        <div className="container">
          <div className="animate-pulse">
            <div className="h-52 bg-sand-3 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}