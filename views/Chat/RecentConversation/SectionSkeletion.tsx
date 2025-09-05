
// Loading skeleton component
export default function SectionSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-pulse">
      <div className="flex flex-col min-w-30 shrink-0">
        <div className="h-4 w-16 bg-sand-3 rounded mb-1" />
        <div className="h-3 w-20 bg-sand-3 rounded" />
      </div>
      <div className="flex flex-col gap-4 flex-1">
        <div className="w-full rounded-2xl border-sand-4 border p-3 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="size-[25px] sm:size-[56px] bg-sand-3 rounded" />
            <div className="h-4 w-3/4 bg-sand-3 rounded" />
          </div>
        </div>
        <div className="w-full rounded-2xl border-sand-4 border p-3 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="size-[25px] sm:size-[56px] bg-sand-3 rounded" />
            <div className="h-4 w-2/3 bg-sand-3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}